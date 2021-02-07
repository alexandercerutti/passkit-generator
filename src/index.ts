import { Pass as PassClass } from "./pass";
import { AbstractModel as AbstractModelClass } from "./abstract";

export { createPass } from "./factory";
export { createAbstractModel } from "./abstract";
export type Pass = InstanceType<typeof PassClass>;
export type AbstractModel = InstanceType<typeof AbstractModelClass>;
