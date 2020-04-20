export interface IUpdaterState {
    [key: string]: any;
    status: "checking" | "downloading" | "noUpdate" | "updateAvailable" | "ready";
    progress: number;
}
