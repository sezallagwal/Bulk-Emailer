"use client";

import * as z from "zod";
import Papa from "papaparse";
import db, { SMTP } from "@/lib/db";
import debounce from "lodash.debounce";
import Navbar from "@/components/navbar";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CloudUpload, Paperclip } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@radix-ui/react-checkbox";
import { useEffect, useMemo, useState } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";

const formSchema = z
  .object({
    host: z.string().optional(),
    port: z.number().min(0).max(65535).optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    tls: z.boolean().default(false).optional(),
    file: z.instanceof(File).optional(),
  })
  .refine(
    (data) =>
      data.file || (data.host && data.port) || data.username || data.password,
    {
      message: "Either provide a file or fill in all the fields",
      path: ["file"],
    }
  );

export default function SmtpPage() {
  const [toSearch, setToSearch] = useState("");
  const [searchResult, setSearchResult] = useState<SMTP[]>([]);

  const dropZoneConfig = {
    maxSize: 1024 * 1024 * 4,
    multiple: false,
    accept: {
      "text/csv": [".csv"],
    },
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: "",
      port: undefined,
      username: "",
      password: "",
      tls: false,
    },
  });

  const fetchAllSmtps = async () => {
    try {
      const allSmtps = await db.smtps.toArray();
      setSearchResult(allSmtps);
    } catch (error) {
      console.error("ON FETCHING ALL SMTPS:", error);
    }
  };

  useEffect(() => {
    fetchAllSmtps();
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        if (searchTerm.trim()) {
          try {
            const filteredData = await db.smtps
              .where("host")
              .startsWithIgnoreCase(searchTerm)
              .toArray();
            setSearchResult(filteredData);
          } catch (error) {
            console.error("ON SEARCHING SMTP:", error);
          }
        } else {
          fetchAllSmtps();
        }
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(toSearch);
    return debouncedSearch.cancel;
  }, [toSearch, debouncedSearch]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.file) {
        const fileContent = await values.file.text();
        const parsedData = await new Promise<SMTP[]>((resolve, reject) =>
          Papa.parse<SMTP>(fileContent, {
            header: true,
            skipEmptyLines: true,
            transform: (value, field) => {
              if (field === "port") return Number(value);
              if (field === "tls") return value.toLowerCase() === "true";
              return value;
            },
            complete: (results) => resolve(results.data),
            error: reject,
          })
        );
        await db.smtps.bulkAdd(parsedData);
      } else {
        delete values.file;
        await db.smtps.add(values as SMTP);
      }
      console.log("SMTP Added");
      form.reset();
      fetchAllSmtps();
    } catch (error) {
      console.error("ON SUBMITTING SMTP:", error);
    }
  };

  const handleEdit = async (smtp: SMTP) => {
    try {
      await db.smtps.update(smtp.smtpId!, smtp);
      fetchAllSmtps();
    } catch (error) {
      console.error("ON EDITING SMTP:", error);
    }
  };

  const handleDelete = async (smtpId: number) => {
    try {
      await db.smtps.delete(smtpId);
      fetchAllSmtps();
    } catch (error) {
      console.error("ON DELETING SMTP:", error);
    }
  };

  return (
    <div className="h-[91vh]">
      <Navbar />
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen p-2 mt-16"
      >
        <ResizablePanel defaultSize={30} minSize={25}>
          <Card className="p-3 h-full">
            <div className="flex gap-2 mb-1">
              <Input
                placeholder="Search SMTP"
                value={toSearch}
                onChange={(e) => setToSearch(e.target.value)}
              />
            </div>
            <div className="py-2 pr-1 scrollbar scrollbar-thumb overflow-auto h-[95%] rounded-xl">
              <div>
                {searchResult.length > 0 ? (
                  searchResult.map((smtp, index) => (
                    <Card key={index} className="mb-2">
                      <CardHeader>
                        <div>
                          <CardTitle>{smtp.host}</CardTitle>
                          <CardDescription>
                            Port: {smtp.port} | Username: {smtp.username}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">
                                    Edit SMTP
                                  </h4>
                                </div>
                                <div className="grid gap-2">
                                  <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="host">Host</Label>
                                    <Input
                                      id="host"
                                      defaultValue={smtp.host}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...smtp,
                                          host: e.target.value,
                                        })
                                      }
                                    />
                                    <Label htmlFor="port">Port</Label>
                                    <Input
                                      id="port"
                                      defaultValue={smtp.port}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...smtp,
                                          port: Number(e.target.value),
                                        })
                                      }
                                    />
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                      id="username"
                                      defaultValue={smtp.username}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...smtp,
                                          username: e.target.value,
                                        })
                                      }
                                    />
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                      id="password"
                                      defaultValue={smtp.password}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...smtp,
                                          password: e.target.value,
                                        })
                                      }
                                    />
                                    <Label htmlFor="tls">TLS</Label>
                                    <Input
                                      id="tls"
                                      defaultValue={smtp.tls.toString()}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...smtp,
                                          tls: e.target.value === "true",
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(smtp.smtpId!)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500">No results found.</p>
                )}
              </div>
            </div>
          </Card>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={50}>
          <Card className="px-2 py-8 h-full">
            <div className="flex flex-col gap-3">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-8 max-w-3xl mx-auto"
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Host"
                                type="text"
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Port"
                                type="number"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Username"
                                type="text"
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder="Password"
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="tls"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="w-4 h-4 border border-gray-300 rounded-sm checked:bg-blue-600 checked:border-transparent focus:outline-none"
                          >
                            {field.value && (
                              <svg
                                className="w-4 h-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.586 4.707 10.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l8-8z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </Checkbox>
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>TLS</FormLabel>

                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload your CSV here</FormLabel>
                        <FormControl>
                          <FileUploader
                            value={field.value ? [field.value] : []}
                            onValueChange={(files) =>
                              field.onChange(files ? files[0] : null)
                            }
                            dropzoneOptions={dropZoneConfig}
                            className="relative bg-background rounded-lg p-2"
                          >
                            <FileInput
                              id="fileInput"
                              className="outline-dashed outline-1 outline-slate-500"
                            >
                              <div className="flex items-center justify-center flex-col p-8 w-full ">
                                <CloudUpload className="text-gray-500 w-10 h-10" />
                                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="font-semibold">
                                    Click to upload
                                  </span>
                                  &nbsp; or drag and drop
                                </p>
                              </div>
                            </FileInput>
                            <FileUploaderContent>
                              {field.value && (
                                <FileUploaderItem index={0}>
                                  <Paperclip className="h-4 w-4 stroke-current" />
                                  <span>{field.value.name}</span>
                                </FileUploaderItem>
                              )}
                            </FileUploaderContent>
                          </FileUploader>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </div>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
