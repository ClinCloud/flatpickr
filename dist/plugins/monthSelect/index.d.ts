import { Plugin } from "../../types/options";
export interface Config {
    shorthand: boolean;
    dateFormat: string;
    altFormat: string;
    theme: string;
}
export interface ElementDate extends Element {
    dateObj: Date;
}
declare function monthSelectPlugin(pluginConfig?: Partial<Config>): Plugin;
export default monthSelectPlugin;
