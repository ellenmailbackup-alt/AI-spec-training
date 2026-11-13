import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Trash2, Check, Images } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  updated: string;
}

interface MediaLibraryProps {
  /** Whether the dialog is open */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When provided the library renders in picker mode: clicking an image calls
   * onSelect with the GCS URL and closes the dialog.
   */
  onSelect?: (url: string) => void;
}

type Folder = "products" | "categories";

function basename(name: string) {
  return name.split("/").pop() ?? name;
}

export function MediaLibrary({ open, onOpenChange, onSelect }: MediaLibraryProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Folder>("products");
  const [deletingFile, setDeletingFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: allFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
    enabled: open,
  });

  const productFiles = allFiles.filter((f) => f.name.startsWith("images/products/"));
  const categoryFiles = allFiles.filter((f) => f.name.startsWith("images/categories/"));
  const activeFiles = activeTab === "products" ? productFiles : categoryFiles;

  const deleteMutation = useMutation({
    mutationFn: async (file: MediaFile) => {
      const res = await fetch(`/api/media?name=${encodeURIComponent(file.name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.reason ?? data.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setDeletingFile(null);
      toast({ title: "Deleted", description: "Image removed from media library" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/media/upload?folder=${activeTab}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.reason ?? data.error ?? "Upload failed");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelect = (file: MediaFile) => {
    if (!onSelect) return;
    onSelect(file.url);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="w-5 h-5" />
              Media Library
              {onSelect && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  — click an image to select it
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as Folder)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="products">
                  Products ({productFiles.length})
                </TabsTrigger>
                <TabsTrigger value="categories">
                  Categories ({categoryFiles.length})
                </TabsTrigger>
              </TabsList>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading…" : "Upload image"}
                </Button>
              </div>
            </div>

            {(["products", "categories"] as Folder[]).map((folder) => (
              <TabsContent
                key={folder}
                value={folder}
                className="flex-1 overflow-y-auto mt-0"
              >
                {isLoading ? (
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : activeFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Images className="w-12 h-12 mb-3 opacity-30" />
                    <p>No images yet. Upload one above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {activeFiles.map((file) => (
                      <div
                        key={file.name}
                        className={`relative group border rounded-lg overflow-hidden bg-muted/30 aspect-square ${
                          onSelect ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""
                        }`}
                        onClick={() => onSelect && handleSelect(file)}
                      >
                        <img
                          src={file.url}
                          alt={basename(file.name)}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          {onSelect && (
                            <div className="flex justify-center items-center h-full">
                              <div className="bg-white rounded-full p-2">
                                <Check className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-end">
                            <span
                              className="text-white text-xs truncate max-w-[70%]"
                              title={basename(file.name)}
                            >
                              {basename(file.name)}
                            </span>
                            <button
                              className="text-white hover:text-red-400 transition-colors"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFile(file);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deletingFile)} onOpenChange={(o) => !o && setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingFile && basename(deletingFile.name)}</strong> will be permanently
              deleted from the media library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingFile && deleteMutation.mutate(deletingFile)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
