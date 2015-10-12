import {relative} from "path";

const ExternalsPlugin = require("webpack/lib/ExternalsPlugin");
const DelegatedModule = require("webpack/lib/DelegatedModule");
const DelegatedSourceDependency = require("webpack/lib/dependencies/DelegatedSourceDependency");

interface ILibraryManifest {
    name: string;
    type?: string;
    content: { [request: string]: number; };
}

interface IManagedCommonReferenceOptions {
    manifest: ILibraryManifest;
}

export class ManagedCommonReferencePlugin {
    private manifest: ILibraryManifest;

    constructor(options: IManagedCommonReferenceOptions) {
        this.manifest = options.manifest;
    }

    apply(compiler) {
        const source = `managed-common-reference ${ this.manifest.name }`;
        const context = compiler.context;

        compiler.apply(new ExternalsPlugin(this.manifest.type || "var", { [source]: this.manifest.name }));

        compiler.plugin("compilation", (compilation, params) => {
            compilation.dependencyFactories.set(DelegatedSourceDependency, params.normalModuleFactory);
        });

        compiler.plugin("normal-module-factory", normalModuleFactory => {
            normalModuleFactory.plugin("create-module", result => {
                const resolvedRequest = `./${ relative(context, result.request) }`;
                if (resolvedRequest in this.manifest.content) {
                    return new DelegatedModule(
                        source,
                        this.manifest.content[resolvedRequest],
                        "require",
                        result.rawRequest);
                }
            });
        });
    }

}
