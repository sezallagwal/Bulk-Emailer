"use client";
import axios from "axios";
import db, { SMTP, Lead } from "@/lib/db";
import Navbar from "../components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";

export default function Home() {
  const [smtps, setSmtps] = useState<SMTP[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [smtpOptions, setSmtpOptions] = useState<Option[]>([]);
  const [folderOptions, setFolderOptions] = useState<Option[]>([]);

  useEffect(() => {
    async function fetchOptionsData() {
      try {
        const [smtpsData, foldersData] = await Promise.all([
          db.smtps.toArray(),
          db.folders.toArray(),
        ]);

        setSmtpOptions(
          smtpsData.map((smtp) => ({
            label: `${smtp.host} - ${smtp.username}`,
            value: smtp.smtpId?.toString() || "value not found",
          }))
        );

        setFolderOptions(
          foldersData.map((folder) => ({
            label: folder.folderName,
            value: folder.folderId?.toString() || "value not found",
          }))
        );
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    }

    fetchOptionsData();
  }, []);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("smtps: ", smtps);
    console.log("leads: ", leads);
    console.log("subject: ", subject);
    console.log("body: ", body);
    const isDelayBetweenEmails = 0;
    const isRandomSmtp = false;

    try {
      const response = await axios.post("/api/email", {
        smtps: smtps,
        leads: leads,
        body: body,
        subject: subject,
        isDelayBetweenEmails,
        isRandomSmtp,
      });

      if (response.status === 200) {
        console.log("Email sent");
      } else {
        console.log("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  return (
    <>
      <div className="h-[92vh]">
        <Navbar />
        <form onSubmit={handleSend} className="mt-[3.6rem]">
          <div className="flex w-full gap-3 p-5">
            <div className="w-full">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter Body"
              />
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="w-full">
                <MultipleSelector
                  options={smtpOptions}
                  placeholder="Select SMTPs"
                  emptyIndicator={
                    <p className="text-center leading-10">
                      No SMTPs available
                    </p>
                  }
                  onChange={async (options) => {
                    const smtpIds = options.map((option) =>
                      parseInt(option.value)
                    );
                    const selectedSmtps = await db.smtps
                      .where("smtpId")
                      .anyOf(smtpIds)
                      .toArray();
                    setSmtps(selectedSmtps);
                  }}
                />
              </div>

              <div className="w-full">
                <MultipleSelector
                  options={folderOptions}
                  placeholder="Select Folders"
                  emptyIndicator={
                    <p className="text-center leading-10">
                      No Leads available
                    </p>
                  }
                  onChange={async (options) => {
                    const folderIds = options.map((option) =>
                      parseInt(option.value)
                    );
                    const selectedLeads = await db.leads
                      .where("folderId")
                      .anyOf(folderIds)
                      .toArray();
                    setLeads(selectedLeads);
                  }}
                />
              </div>

              <Input
                type="text"
                value={subject}
                placeholder="Enter Subject"
                onChange={(e) => setSubject(e.target.value)}
              />
              <div className="flex justify-center">
                <Button type="submit" className="p-3 text-md">Send</Button>
              </div>
            </div>
          </div>
        </form>
        <div className="border min-h-[400px] m-5 rounded-xl p-4"></div>
      </div>
    </>
  );
}
