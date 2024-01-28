import Web from '../model/Web';
import Service from '../model/Service';
import { DepGraph } from 'dependency-graph';
import PQueue from 'p-queue';
import { isEmpty, isNotNullOrUndefined } from '@silvermine/toolbox';
import { DeploymentTargetConfig } from '../config/schemas/auto-generated-types';

interface EventHandlers {
   onEnqueue: (svc: Service, dependents: readonly Service[]) => void;
   onSkip: (svc: Service, dependents: readonly Service[]) => void;
}

export class DeploymentGraph {

   private _graph: DepGraph<Service>;
   private _pending: Set<string> = new Set();
   private _servicesToVisit: string[] = [];
   private _eventHandlers: EventHandlers;

   public constructor(web: Web, servicesToVisit: readonly Service[], private _envGroup: string, eventHandlers: Partial<EventHandlers> = {}) { // eslint-disable-line max-len
      this._graph = web.dependencyGraph();
      this._servicesToVisit = servicesToVisit.map((svc) => { return svc.ID; });

      this._eventHandlers = {
         onEnqueue: () => {}, // eslint-disable-line no-empty-function
         onSkip: () => {}, // eslint-disable-line no-empty-function
         ...eventHandlers,
      };
   }

   public services(): Service[] {
      const svcIDs = this._servicesToVisit
         ? this._servicesToVisit.filter((svcID) => { return this._graph.hasNode(svcID); })
         : this._graph.overallOrder();

      return svcIDs.map((svcID) => {
         return this._graph.getNodeData(svcID);
      });
   }

   public stats(): { pending: number; unstarted: number } {
      return {
         pending: this._pending.size,
         unstarted: this.services().length - this._pending.size,
      };
   }

   public pruneDependenciesOf(svcID: string): string[] {
      const deps = this._graph.dependenciesOf(svcID);

      deps.forEach((depID) => {
         this._graph.removeNode(depID);
      });

      return deps;
   }

   public async walk(callback: (svc: Service, targets: readonly DeploymentTargetConfig[]) => Promise<void>, { concurrency } = { concurrency: 3 }): Promise<void> { // eslint-disable-line max-len
      const queue = new PQueue({ concurrency });

      const enqueueBatch = (): void => {
         const batch = this._popBatch();

         batch.forEach((svc) => {
            this._eventHandlers.onEnqueue(svc, svc.directDependents());
            queue.add(async () => {
               await callback(svc, svc.deploymentTargetsFor(this._envGroup)); // eslint-disable-line callback-return
               this._markAsComplete(svc);
               enqueueBatch();
            });
         });
      };

      while (this._graph.size()) {
         enqueueBatch();
         await queue.onIdle();
      }
   }

   private _popBatch(): Service[] {
      return this._graph.overallOrder(true)
         .filter((svcID) => {
            return !this._pending.has(svcID);
         })
         .map((svcID) => {
            const svc = this._graph.getNodeData(svcID),
                  targets = svc.deploymentTargetsFor(this._envGroup);

            if (isEmpty(targets)) {
               this._graph.removeNode(svcID);
               return undefined;
            }

            if (this._servicesToVisit && !this._servicesToVisit.includes(svcID)) {
               this._eventHandlers.onSkip(svc, svc.directDependents());
               this._graph.removeNode(svcID);
               return undefined;
            }

            this._pending.add(svcID);
            return svc;
         })
         .filter(isNotNullOrUndefined);
   }

   private _markAsComplete(svc: Service): void {
      this._pending.delete(svc.ID);
      this._graph.removeNode(svc.ID);
   }

}
