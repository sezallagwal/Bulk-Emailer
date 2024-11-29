"use client";

import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import Navbar from "@/components/navbar";
import db from "@/lib/db";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<number>(5);
  const [randomSmtp, setRandomSmtp] = useState<boolean>(false);
  const [randomContent, setRandomContent] = useState<boolean>(false);

  useEffect(() => {
    const initializeSettings = async () => {
      await db.initializeDefaultSettings();

      const settings = await db.fetchAllSettingsAsObject();

      setDelayBetweenEmails(settings.delayBetweenEmails as number);
      setRandomSmtp(settings.randomSmtp as boolean);
      setRandomContent(settings.randomContent as boolean);
    };

    initializeSettings();
  }, []);

  const handleChangeDelay = useCallback(async (value: number[]) => {
    const newValue = value[0];
    setDelayBetweenEmails(newValue);
    await db.updateSetting("delayBetweenEmails", newValue);
    console.log("delayBetweenEmails updated!");
  }, []);

  const handleToggleRandomSmtp = useCallback(async (value: boolean) => {
    setRandomSmtp(value);
    await db.updateSetting("randomSmtp", value);
    console.log("randomSmtp updated!");
  }, []);

  const handleToggleRandomContent = useCallback(async (value: boolean) => {
    setRandomContent(value);
    await db.updateSetting("randomContent", value);
    console.log("randomContent updated!");
  }, []);

  const resetValues = useCallback(async () => {
    await db.resetToDefaultSettings();

    const settings = await db.fetchAllSettingsAsObject();
    setDelayBetweenEmails(settings.delayBetweenEmails as number);
    setRandomSmtp(settings.randomSmtp as boolean);
    setRandomContent(settings.randomContent as boolean);
    console.log("Settings reset to defaults!");
  }, []);

  return (
    <div className="h-[92vh]">
      <Navbar />
      <div className="p-4 space-y-6 mt-16">
        <div className="flex items-center justify-between">
          <label>Delay Between Emails</label>
          <Slider
            value={[delayBetweenEmails]}
            min={1}
            max={30}
            step={1}
            onValueChange={handleChangeDelay}
            className="w-1/2"
          />
          <span className="text-lg">{delayBetweenEmails}s</span>
        </div>

        <div className="flex items-center justify-between">
          <label>Randomize SMTP</label>
          <Switch
            checked={randomSmtp}
            onCheckedChange={handleToggleRandomSmtp}
          />
        </div>

        <div className="flex items-center justify-between">
          <label>Randomize Content</label>
          <Switch
            checked={randomContent}
            onCheckedChange={handleToggleRandomContent}
          />
        </div>

        <div className="text-center">
          <Button onClick={resetValues} variant="destructive">
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}
