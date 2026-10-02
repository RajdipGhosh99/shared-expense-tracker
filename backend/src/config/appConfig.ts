/**
 * Backend Application-Level Configuration
 * Configured in-app, independent of environment files (.env).
 */
class AppConfig {
  /**
   * Backend App-Level Google Sheet Sync toggle:
   * Set to false to completely disable background Google Sheet mirroring across the entire app.
   */
  private _googleSheetSync: boolean = true;

  get googleSheetSync(): boolean {
    return this._googleSheetSync;
  }

  set googleSheetSync(enabled: boolean) {
    this._googleSheetSync = Boolean(enabled);
  }
}

export const appConfig = new AppConfig();
