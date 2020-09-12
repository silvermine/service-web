import Web from '../model/Web';
import Service from '../model/Service';

function representedElsewhere(svc: Service, dep: Service): boolean {
   return !!svc.dependsOn().find((d2) => {
      return d2 !== dep && d2.dependsOn().includes(dep);
   });
}

export default class MermaidServiceDependencyGraph {

   private _graph: string = '';
   private _web: Web;
   private _service?: Service;
   private _generated = false;
   private _defined: string[] = [];

   public constructor(format: string, web: Web, svc?: Service) {
      this._addLine(`flowchart ${format}`, 0);
      this._web = web;
      this._service = svc;
   }

   public generate(): string {
      if (!this._generated) {
         if (this._service) {
            this._graphSingleService(this._service, { skipDependenciesOnRootServices: false, addRoots: true });
         } else {
            this._graphWeb();
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
         return `${s.ID}[${s.ID}]`;
      }

      return `${s.ID}([${s.ID}])`;

   }
   private _addLine(l: string, indent = 1): void {
      this._graph += '   '.repeat(indent) + l + '\n';
   }

   private _graphSingleService(svc: Service, opts: { skipDependenciesOnRootServices: boolean; addRoots: boolean }): void {
      svc.dependsOn().forEach((dep) => {
         if (opts.skipDependenciesOnRootServices && (!svc.config.isRootDependency && dep.config.isRootDependency)) {
            return;
         }

         if (!representedElsewhere(svc, dep)) {
            const arrow = dep.config.isRootDependency && !svc.config.isRootDependency ? '-..->' : '-->';

            this._addLine(`${this._getLabel(svc)} ${arrow} ${this._getLabel(dep)}`);
         }
      });

      if (opts.addRoots) {
         this._web.dependencyOrder().filter((s) => { return s.config.isRootDependency; }).forEach((root) => {
            this._graphSingleService(root, { skipDependenciesOnRootServices: false, addRoots: false });
         });
      }
   }

   private _graphWeb(): void {
      const rootServices: Service[] = [];

      // Make a subgraph for each system, containing the non-root services contained in
      // that system. Root services will be pulled out into a separate subgraph.
      const systems = this._web.dependencyOrder().reduce((memo, svc) => {
         if (svc.config.isRootDependency) {
            rootServices.push(svc);
            return memo;
         }
         memo[svc.system.name] = memo[svc.system.name] || [];
         memo[svc.system.name].push(svc);
         return memo;
      }, {} as { [sysName: string]: Service[] });

      if (rootServices.length) {
         // Make a "root" subgraph box that contains all the root dependencies.
         // The inter-dependencies between these root dependencies will be defined later
         // all dependencies are defined at the bottom of the main graph.
         systems.root = rootServices;
      }

      // Now actually make those subgraphs we've been talking about.
      Object.keys(systems).forEach((sysName) => {
         this._addLine(`subgraph ${sysName}`);
         systems[sysName].forEach((svc) => {
            this._addLine(this._getLabel(svc));
         });
         this._addLine('end\n');
      });

      // And now represent all the dependencies
      this._web.dependencyOrder().forEach((svc) => {
         this._graphSingleService(svc, { skipDependenciesOnRootServices: true, addRoots: false });
      });

      if (rootServices.length) {
         // And now make a dependency between each system and the root system. Currently
         // the root subgraph ends up looking a bit ugly; the flow of services is
         // upsidedown from what you would expect when using a default BT chart. See
         // https://github.com/mermaid-js/mermaid/issues/1678 where I reported this issue.
         Object.keys(systems).filter((s) => { return s !== 'root'; }).forEach((sys) => {
            this._addLine(`${sys} -..-> root`);
         });
      }
   }
}
