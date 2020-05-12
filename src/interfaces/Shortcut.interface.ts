export default interface ISteamShortcut {
    shortcuts: ISteamShortcutEntry[]
}

export interface ISteamShortcutEntry {
    AllowDesktopConfig: boolean;
    AllowOverlay: boolean;
    AppName: string;
    Devkit: boolean;
    DevkitGameID: string;
    Exe: string;
    icon: string;
    IsHidden: boolean;
    LastPlayTime: number;
    LaunchOptions: "",
    OpenVR: boolean;
    ShortcutPath: string;
    StartDir: string;
    tags: string[];
    steamScanner?: boolean;
}