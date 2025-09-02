"use server";
import { PKPass } from "passkit-generator";

export const demoPasskit = async () => {
	const pass = new PKPass();
	console.log(pass);
	return null;
};
