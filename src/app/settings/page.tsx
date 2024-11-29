"use client";

import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Settings() {
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(3);

  useEffect(() => {
    console.log("Delay between emails", delayBetweenEmails);
    if (delayBetweenEmails) {
      const sendDelayBetweenEmails = async () => {
        try {
          await axios.post("/api/settings", { delayBetweenEmails });
          console.log("Delay between emails sent to server");
        } catch (error) {
          console.error("Error sending delay between emails:", error);
        }
      };
      sendDelayBetweenEmails();
    }
  }, [delayBetweenEmails]);
  if (typeof isDelayBetweenEmails !== "number") {
    return NextResponse.json(
      { error: "Invalid delay between emails setting" },
      { status: 500 }
    );
  }
  return (
    <div>
      <h1>Settings</h1>
      <h2>Delay between emails</h2>
      <div>{delayBetweenEmails} seconds</div>
      <Slider
        value={[delayBetweenEmails]}
        onValueChange={(value) => setDelayBetweenEmails(value[0])}
        min={1}
        max={10}
      />
    </div>
  );
}
