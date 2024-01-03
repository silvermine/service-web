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
      const services = this._systems.reduce((memo, sys) => {
         sys.services.forEach((svc) => {
            memo.push(svc);
         });
         return memo;
      }, [] as Service[]);

      // This sort is not strictly necessary, but allows for better testing because having
      // the services sorted in some deterministic way provides for deterministic results.
      services.sort((a, b) => {
         if (a.configPath < b.configPath) {
            return -1;
         } else if (a.configPath > b.configPath) {
            return 1;
         }
         return 0;
      });

      return services;
   }

   public systemAdded(sys: System): void {
      this._systems.push(sys);
      this._clearCurrentCachedGraph();
   }

   public serviceAdded(_svc: Service): void { // eslint-disable-line @typescript-eslint/no-unused-vars
      this._clearCurrentCachedGraph();
   }

   public dependencyOrder(reverse = false): ReadonlyArray<Service> {
      const graph = this._computeCachedGraph();

      const svcs = graph.overallOrder().map((svcID) => {
         return graph.getNodeData(svcID);
      });

      return reverse ? svcs.reverse() : svcs;
   }

   public dependenciesOf(svc: Service, reverse = false): ReadonlyArray<Service> {
      const graph = this._computeCachedGraph();

      const svcs = graph.dependenciesOf(svc.ID).map((svcID) => {
         return graph.getNodeData(svcID);
      });

      return reverse ? svcs.reverse() : svcs;
   }

   public getServiceFromDirectory(dir: string): Service | undefined {
      return this.services.find((svc) => {
         return svc.rootDir === dir;
      });
   }

   public getServiceByName(name: string): Service | undefined {
      return this.services.find((svc) => {
         return svc.name === name || svc.ID === name;
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
               svcEnvGroups = svc.getAllEnvironmentGroups(),
               dependencies = svc.config.dependsOn || [];

         dependencies.forEach((dependency) => {
            if (allServices.indexOf(dependency) === -1) {
               throw new ConfigValidationError(
                  'Service',
                  svc.configPath,
                  `Service ${svcID} claims to depend on non-existent service ${dependency}`
               );
            }

            const dep = graph.getNodeData(dependency),
                  depEnvGroups = dep.getAllEnvironmentGroups(),
                  svcDeployedToSameEnvGroupsAsDep = svcEnvGroups.every((envGroup) => { return depEnvGroups.includes(envGroup); });

            if (!svcDeployedToSameEnvGroupsAsDep) {
               throw new ConfigValidationError(
                  'Service',
                  svc.configPath,
                  `Service ${svcID} depends on service ${dependency} across environment groups.`
                     + ' The deployment ordering for this cannot be guaranteed.'
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
