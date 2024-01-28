import Web from '../model/Web';
import Service from '../model/Service';
import { DeploymentGraph } from '../lib/DeploymentGraph';
import { isEmpty } from '@silvermine/toolbox';

export default class MermaidServiceDeploymentGraph {

   private _graph: string = '';
   private _web: Web;
   private _generated = false;
   private _defined: string[] = [];

   public constructor(web: Web, private _envGroup: string, private _services: readonly Service[]) {
      this._addLine('flowchart-elk RL', 0);
      this._addLine('classDef skipped color:#ccc,fill:#777,stroke:#333,stroke-dasharray: 5 5');
      this._web = web;
   }

   public async generate(): Promise<string> {
      if (!this._generated) {
         const rootSubGraph: string[] = [];

         const addService = (isSkipped: boolean, svc: Service, dependents: readonly Service[]): void => {
            if (isEmpty(svc.config.dependsOn) && !svc.config.isRootDependency) {
               this._addLine(`${this._getLabel(svc)}${isSkipped ? ':::skipped' : ''} --> rootDeps`);
            }

            dependents.forEach((dependent) => {
               if (svc.config.isRootDependency && !dependent.config.isRootDependency) {
                  return;
               }

               const isDependentSkipped = !this._services.find((s) => { return s.ID === dependent.ID; });

               const line = `${this._getLabel(dependent)}${isDependentSkipped ? ':::skipped' : ''}`
                  + ` --> ${this._getLabel(svc)}${isSkipped ? ':::skipped' : ''}`;

               if (svc.config.isRootDependency && dependent.config.isRootDependency) {
                  rootSubGraph.push(line);
               } else {
                  this._addLine(line);
               }
            });
         };

         const deploymentGraph = new DeploymentGraph(this._web, this._services, this._envGroup, {
            onEnqueue: addService.bind(this, false),
            onSkip: addService.bind(this, true),
         });

         await deploymentGraph.walk(() => { return Promise.resolve(); });

         if (!isEmpty(rootSubGraph)) {
            this._addLine('subgraph rootDeps[Root Dependencies]');
            rootSubGraph.forEach((line) => {
               this._addLine(line, 2);
            });
            this._addLine('end');
         }
      }

      this._generated = true;
      return this._graph;
   }

   private _getLabel(s: Service): string {
      if (this._defined.includes(s.ID)) {
         return s.ID;
      }

      this._defined.push(s.ID);

      if (s.config.isRootDependency) {
         return `${s.ID}([${s.ID}])`;
      }

      return `${s.ID}([${s.ID}])`;
   }

   private _addLine(l: string, indent = 1): void {
      this._graph += '   '.repeat(indent) + l + '\n';
   }

}
