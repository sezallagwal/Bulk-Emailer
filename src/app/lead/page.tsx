"use client";

import * as z from "zod";
import Papa from "papaparse";
import debounce from "lodash.debounce";
import Navbar from "@/components/navbar";
import { useForm } from "react-hook-form";
import db, { Folder, Lead } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CloudUpload, Paperclip } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
    folderName: z.string().min(1, "Folder Name is required"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    file: z.instanceof(Blob).optional(),
  })
  .refine((data) => data.email || data.file, {
    message: "Either provide a file or fill in all the fields",
    path: ["file"],
  });

export default function LeadPage() {
  const [toSearch, setToSearch] = useState("");
  const [searchResult, setSearchResult] = useState<Folder[]>([]);
  // const [leads, setLeads] = useState<Lead[]>([]);

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
      folderName: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const fetchAllFolders = async () => {
    try {
      const allFolders = await db.folders.toArray();
      setSearchResult(allFolders);
    } catch (error) {
      console.error("ON FETCHING ALL FOLDERS:", error);
    }
  };

  useEffect(() => {
    fetchAllFolders();
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        if (searchTerm.trim()) {
          try {
            const filteredData = await db.folders
              .where("folderName")
              .startsWithIgnoreCase(searchTerm)
              .toArray();
            setSearchResult(filteredData);
          } catch (error) {
            console.error("ON SEARCHING FOLDERS:", error);
          }
        } else {
          fetchAllFolders();
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
      const folderData = {
        folderName: values.folderName,
      };
      const folderId = await db.folders.add(folderData);
      if (values.file) {
        const fileContent = await values.file.text();
        const parsedData = await new Promise<Lead[]>((resolve, reject) =>
          Papa.parse<Lead>(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: reject,
          })
        );
        const leadsData = parsedData.map((lead) => ({
          ...lead,
          folderId,
        }));
        await db.leads.bulkAdd(leadsData);
      } else {
        delete values.file;
        const leadData: Lead = {
          folderId,
          firstName: values.firstName || "",
          lastName: values.lastName || "",
          email: values.email || "",
        };
        console.log(leadData);
        await db.leads.add(leadData);
      }
      console.log("Lead Added");
      form.reset();
      fetchAllFolders();
    } catch (error) {
      console.error("ON SUBMITTING LEAD:", error);
    }
  };

  const handleEdit = async (folder: Folder) => {
    try {
      await db.folders.update(folder.folderId!, folder);
      fetchAllFolders();
    } catch (error) {
      console.error("ON EDITING FOLDER:", error);
    }
  };

  const handleDelete = async (folderId: number) => {
    try {
      await db.folders.delete(folderId);
      await db.leads.where({ folderId }).delete();
      fetchAllFolders();
    } catch (error) {
      console.error("ON DELETING FOLDER:", error);
    }
  };

  const showLeads = (folder: Folder) => {
    console.log("Show Leads");
    console.log(folder.folderName);
    // const fetchLeads = async () => {
    //   try {
    //     const leads = await db.leads
    //       .where({ folderId: folder.folderId })
    //       .toArray();
    //     console.log(leads);
    //     setLeads(leads);
    //   } catch (error) {
    //     console.error("ON FETCHING LEADS:", error);
    //   }
    // };

    // fetchLeads();
  };

  return (
    <div className="h-[91vh]">
      <Navbar />
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen p-2 mt-[3.6rem]"
      >
        <ResizablePanel defaultSize={30} minSize={25}>
          <Card className="p-3 h-full border-none">
            <div className="flex gap-2 mb-1">
              <Input
                placeholder="Search Folder"
                value={toSearch}
                onChange={(e) => setToSearch(e.target.value)}
              />
            </div>
            <div className="py-2 pr-1 scrollbar scrollbar-thumb overflow-auto h-[95%] rounded-xl">
              <div>
                {searchResult.length > 0 ? (
                  searchResult.map((folder, index) => (
                    <Card
                      key={index}
                      className="mb-2"
                      onClick={() => showLeads(folder)}
                    >
                      <CardHeader>
                        <CardTitle>{folder.folderName}</CardTitle>
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
                                    Edit Folder
                                  </h4>
                                </div>
                                <div className="grid gap-2">
                                  <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="folderName">
                                      Folder Name
                                    </Label>
                                    <Input
                                      id="folderName"
                                      defaultValue={folder.folderName}
                                      className="col-span-2 h-8"
                                      onChange={(e) =>
                                        handleEdit({
                                          ...folder,
                                          folderName: e.target.value,
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
                            onClick={() => handleDelete(folder.folderId!)}
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
          <Card className="h-screen p-3 border-none">
            <div className="flex flex-col gap-3">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-8 max-w-3xl mx-auto py-10"
                >
                  <FormField
                    control={form.control}
                    name="folderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Folder Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Folder Name"
                            type="text"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First Name"
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
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Last Name"
                                type="text"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" type="text" {...field} />
                        </FormControl>

                        <FormMessage />
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
                            value={field.value ? [field.value as File] : []}
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  SVG, PNG, JPG or GIF
                                </p>
                              </div>
                            </FileInput>
                            <FileUploaderContent>
                              {field.value && (
                                <FileUploaderItem index={0}>
                                  <Paperclip className="h-4 w-4 stroke-current" />
                                  <span>{(field.value as File).name}</span>
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
