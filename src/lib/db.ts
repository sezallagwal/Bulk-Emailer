import Dexie, { Table } from "dexie";
interface Folder {
  folderId?: number;
  folderName: string;
}

interface Lead {
  leadId?: number;
  folderId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface SMTP {
  smtpId?: number;
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
}

interface Content {
  contentId?: number;
  subject: string;
  body: string;
}

const defaultSettings: Record<string, number | boolean | string> = {
  delayBetweenEmails: 5,
  randomSmtp: false,
  randomContent: false,
};

class AppDatabase extends Dexie {
  folders!: Table<Folder, number>;
  leads!: Table<Lead, number>;
  smtps!: Table<SMTP, number>;
  content!: Table<Content, number>;
  settings!: Table<string | number | boolean, string>;

  constructor() {
    super("bulkMailer");

    this.version(1).stores({
      folders: "++folderId, folderName",
      leads: "++leadId, folderId, firstName, lastName, email",
      smtps: "++smtpId, host, port, tls, username, password",
      content: "++contentId, subject, body",
      settings: "",
    });

    this.addEventListeners();
  }

  private addEventListeners() {
    this.on("blocked", () => {
      console.error(
        "Database upgrade blocked by another open connection. Please close other tabs or windows using this app."
      );
    });

    this.on("versionchange", () => {
      console.warn(
        "A newer version of the database is available. Reloading to apply updates."
      );
      this.close();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  }

  async initializeDefaultSettings() {
    await this.transaction("rw", this.settings, async () => {
      for (const [key, value] of Object.entries(defaultSettings)) {
        const existing = await this.settings.get(key);
        if (existing === undefined) {
          await this.settings.put(value, key);
        }
      }
    });
  }

  async fetchAllSettingsAsObject(): Promise<
    Record<string, number | boolean | string>
  > {
    const allEntries = await this.settings.toArray();
    const allSettings: Record<string, number | boolean | string> = {};

    for (const [key, value] of Object.entries(allEntries)) {
      allSettings[key] = value;
    }

    return allSettings;
  }

  async updateSetting(key: string, value: number | boolean | string) {
    await this.settings.put(value, key);
  }

  async resetToDefaultSettings() {
    await this.transaction("rw", this.settings, async () => {
      for (const [key, value] of Object.entries(defaultSettings)) {
        await this.settings.put(value, key);
      }
    });
  }
}

const db = new AppDatabase();

export default db;
export { defaultSettings };
export type { Folder, Lead, SMTP, Content };
