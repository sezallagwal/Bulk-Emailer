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

interface Setting {
  key: string;
  value: string | number | boolean;
}

class AppDatabase extends Dexie {
  folders!: Table<Folder, number>;
  leads!: Table<Lead, number>;
  smtps!: Table<SMTP, number>;
  content!: Table<Content, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super("database");

    this.version(1).stores({
      folders: "++folderId, folderName",
      leads: "++leadId, folderId, firstName, lastName, email",
      smtps: "++smtpId, host, port, tls, username, password",
      content: "++contentId, subject, body",
      settings: "key, value",
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

  async resetDatabase() {
    try {
      await this.delete();
      console.info("Database has been reset.");
    } catch (error) {
      console.error("Error resetting database:", error);
    }
  }
}

const db = new AppDatabase();

export default db;
export type { Folder, Lead, SMTP, Content, Setting };
