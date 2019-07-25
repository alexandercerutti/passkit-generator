import { Pass } from "./src/pass";
import { AbstractModel } from "./src/abstract";

export { createPass } from "./src/factory";
export { createAbstractModel } from "./src/abstract";
export type Pass = InstanceType<typeof Pass>
export type AbstractModel = InstanceType<typeof AbstractModel>
