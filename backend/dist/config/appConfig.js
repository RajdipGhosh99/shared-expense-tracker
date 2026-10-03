/**
 * Backend Application-Level Configuration
 * Configured in-app, independent of environment files (.env).
 */
class AppConfig {
    /**
     * Backend App-Level Google Sheet Sync toggle:
     * Set to false to completely disable background Google Sheet mirroring across the entire app.
     */
    _googleSheetSync = true;
    get googleSheetSync() {
        return this._googleSheetSync;
    }
    set googleSheetSync(enabled) {
        this._googleSheetSync = Boolean(enabled);
    }
}
export const appConfig = new AppConfig();
//# sourceMappingURL=appConfig.js.map