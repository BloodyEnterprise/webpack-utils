import {relative} from "path";

const ExternalsPlugin = require("webpack/lib/ExternalsPlugin");
const DelegatedPlugin = require("webpack/lib/DelegatedPlugin");
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

export default class ManagedCommonReferencePlugin {
    private manifest: ILibraryManifest;

    constructor(options: IManagedCommonReferenceOptions) {
        this.manifest = options.manifest;
    }

    apply(compiler) {
        const source = `managed-common-reference ${this.manifest.name}`;

        compiler.apply(new ExternalsPlugin("var", { [source]: this.manifest.name }));

        compiler.plugin("compilation", (compilation, params) => {
            compilation.dependencyFactories.set(DelegatedSourceDependency, params.normalModuleFactory);
        });

        compiler.plugin("normal-module-factory", (normalModuleFactory) => {
            normalModuleFactory.plugin("create-module", (result) => {
                const resolvedRequest = `./${relative(__dirname, result.request) }`;
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
