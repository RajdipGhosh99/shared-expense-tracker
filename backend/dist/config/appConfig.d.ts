/**
 * Backend Application-Level Configuration
 * Configured in-app, independent of environment files (.env).
 */
declare class AppConfig {
    /**
     * Backend App-Level Google Sheet Sync toggle:
     * Set to false to completely disable background Google Sheet mirroring across the entire app.
     */
    private _googleSheetSync;
    get googleSheetSync(): boolean;
    set googleSheetSync(enabled: boolean);
}
export declare const appConfig: AppConfig;
export {};
//# sourceMappingURL=appConfig.d.ts.map