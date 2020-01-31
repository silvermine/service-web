import System from './System';
import BaseUnit from './BaseUnit';
import Service from './Service';
import { DepGraph } from 'dependency-graph';
import { ServiceWebConfig } from '../config/schemas/ServiceWebConfig';
import ConfigValidationError from '../errors/ConfigValidationError';

export default class Web extends BaseUnit<ServiceWebConfig> {

   private _systems: System[] = [];
   private _graph: DepGraph<Service> | undefined;

   public constructor(configPath: string, config: ServiceWebConfig) {
      super(configPath, config);
   }

   public get systems(): ReadonlyArray<System> {
      return this._systems;
   }

   public get services(): ReadonlyArray<Service> {
      return this._systems.reduce((memo, sys) => {
         sys.services.forEach((svc) => {
            memo.push(svc);
         });
         return memo;
      }, [] as Service[]);
   }

   public systemAdded(sys: System): void {
      this._systems.push(sys);
      this._clearCurrentCachedGraph();
   }

   public serviceAdded(_svc: Service): void { // eslint-disable-line @typescript-eslint/no-unused-vars
      this._clearCurrentCachedGraph();
   }

   public dependencyOrder(): ReadonlyArray<Service> {
      const graph = this._computeCachedGraph();

      return graph.overallOrder().map((svcID) => {
         return graph.getNodeData(svcID);
      });
   }

   public dependenciesOf(svc: Service): ReadonlyArray<Service> {
      const graph = this._computeCachedGraph();

      return graph.dependenciesOf(svc.ID).map((svcID) => {
         return graph.getNodeData(svcID);
      });
   }

   private _clearCurrentCachedGraph(): void {
      this._graph = undefined;
   }

   private _computeCachedGraph(): DepGraph<Service> {
      if (this._graph) {
         return this._graph;
      }

      const graph = new DepGraph<Service>();

      const allServices: string[] = [],
            rootServices: string[] = [];

      this.services.forEach((svc) => {
         graph.addNode(svc.ID, svc);
         allServices.push(svc.ID);
         if (svc.config.isRootDependency) {
            rootServices.push(svc.ID);
         }
      });

      graph.overallOrder().forEach((svcID) => {
         const svc = graph.getNodeData(svcID),
               dependencies = svc.config.dependsOn || [];

         dependencies.forEach((dependency) => {
            if (allServices.indexOf(dependency) === -1) {
               throw new ConfigValidationError(
                  'Service',
                  svc.configPath,
                  `Service ${svcID} claims to depend on non-existent service ${dependency}`
               );
            }

            graph.addDependency(svcID, dependency);
         });
      });

      // now add root dependencies to all non-root services:
      graph.overallOrder().forEach((svcID) => {
         if (rootServices.indexOf(svcID) !== -1) {
            return;
         }

         rootServices.forEach((rootSvcID) => {
            if (graph.dependenciesOf(svcID).indexOf(rootSvcID) === -1) {
               graph.addDependency(svcID, rootSvcID);
            }
         });
      });

      this._graph = graph;

      return this._graph;
   }
}
