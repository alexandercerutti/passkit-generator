import { Pass as PassClass } from "./src/pass";
import { AbstractModel as AbstractModelClass } from "./src/abstract";

export { createPass } from "./src/factory";
export { createAbstractModel } from "./src/abstract";
export type Pass = InstanceType<typeof PassClass>
export type AbstractModel = InstanceType<typeof AbstractModelClass>
