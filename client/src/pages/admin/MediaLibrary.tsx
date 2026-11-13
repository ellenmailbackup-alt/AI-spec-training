import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Upload, Trash2, Images, ExternalLink } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  updated: string;
}

type Folder = "products" | "categories";

function basename(name: string) {
  return name.split("/").pop() ?? name;
}

export default function AdminMediaLibrary() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Folder>("products");
  const [deletingFile, setDeletingFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: allFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold mb-2">Media Library</h1>
              <p className="text-muted-foreground">Browse and manage uploaded images</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading…" : "Upload image"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as Folder)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="products">
                Product images ({productFiles.length})
              </TabsTrigger>
              <TabsTrigger value="categories">
                Category images ({categoryFiles.length})
              </TabsTrigger>
            </TabsList>

            {(["products", "categories"] as Folder[]).map((folder) => (
              <TabsContent key={folder} value={folder}>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : activeFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border rounded-lg bg-muted/20">
                    <Images className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">No images yet</p>
                    <p className="text-sm">Upload an image using the button above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {activeFiles.map((file) => (
                      <div
                        key={file.name}
                        className="relative group border rounded-lg overflow-hidden bg-muted/30 aspect-square"
                      >
                        <img
                          src={file.url}
                          alt={basename(file.name)}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white hover:text-blue-300 transition-colors"
                              title="Open in new tab"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <div className="flex justify-between items-end">
                            <span
                              className="text-white text-xs truncate max-w-[75%]"
                              title={basename(file.name)}
                            >
                              {basename(file.name)}
                            </span>
                            <button
                              className="text-white hover:text-red-400 transition-colors"
                              title="Delete"
                              onClick={() => setDeletingFile(file)}
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
        </div>
      </div>

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
    </AdminLayout>
  );
}
