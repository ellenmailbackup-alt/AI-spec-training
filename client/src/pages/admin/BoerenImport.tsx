import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  Download,
  ChevronRight,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

// Types
interface ExcelRow {
  rowNumber: number;
  farmNumber: string;
  farmName: string;
  salesDate: string;
  productReference: string;
  productName: string;
  quantity: number;
  unitPriceExclVAT: number;
}

interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface MappingSuggestion {
  productReference: string;
  productName: string;
  suggestedSalesPriceId: number | null;
  suggestedProduct?: {
    id: number;
    name: string;
    nameDutch: string;
  };
  suggestedSalesPrice?: {
    id: number;
    productId: number;
    amount: number;
    unit: string;
    b2cPriceWithoutVat: string;
    b2cPriceWithVat: string;
  };
  confidence: 'high' | 'medium' | 'low' | 'none';
}

interface ParsedImport {
  rows: ExcelRow[];
  validationErrors: ValidationError[];
  unmappedProducts: MappingSuggestion[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    uniqueFarms: number;
  };
}

interface ImportResult {
  success: boolean;
  salesCreated: number;
  salesLinesCreated: number;
  errors: string[];
}

type ImportStep = 'upload' | 'validate' | 'execute' | 'complete';

export default function BoerenImport() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImport | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Parse file mutation
  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/boeren-import/parse', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse file');
      }

      return response.json();
    },
    onSuccess: (data: ParsedImport) => {
      setParsedData(data);
      setStep('validate');
      toast({
        title: "File parsed successfully",
        description: `Found ${data.summary.totalRows} rows from ${data.summary.uniqueFarms} farms`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error parsing file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save mapping mutation
  const saveMappingMutation = useMutation({
    mutationFn: async ({ productReference, salesPriceId }: { productReference: string; salesPriceId: number }) => {
      const response = await apiRequest('POST', '/api/boeren-import/save-mapping', { productReference, salesPriceId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update the parsedData to remove this unmapped product
      if (parsedData) {
        setParsedData({
          ...parsedData,
          unmappedProducts: parsedData.unmappedProducts.filter(
            p => p.productReference !== variables.productReference
          ),
        });
      }
      toast({
        title: "Mapping saved",
        description: "Product mapping saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Execute import mutation
  const executeMutation = useMutation({
    mutationFn: async (rows: ExcelRow[]): Promise<ImportResult> => {
      const response = await apiRequest('POST', '/api/boeren-import/execute', { rows });
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setShowConfirmDialog(false); // Close dialog after success
      setImportResult(data);
      setStep('complete');
      toast({
        title: data.success ? "Import completed" : "Import completed with errors",
        description: `Created ${data.salesCreated} sales with ${data.salesLinesCreated} lines`,
        variant: data.success ? "default" : "destructive",
      });

      // Invalidate sales queries
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    },
    onError: (error: Error) => {
      setShowConfirmDialog(false); // Close dialog after error
      toast({
        title: "Error executing import",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      parseMutation.mutate(selectedFile);
    }
  };

  const handleAcceptSuggestion = (suggestion: MappingSuggestion) => {
    if (suggestion.suggestedSalesPriceId) {
      saveMappingMutation.mutate({
        productReference: suggestion.productReference,
        salesPriceId: suggestion.suggestedSalesPriceId,
      });
    }
  };

  const handleExecuteImport = () => {
    if (parsedData) {
      executeMutation.mutate(parsedData.rows);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setParsedData(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canProceed = parsedData && parsedData.unmappedProducts.length === 0 && parsedData.summary.errorRows === 0;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Boeren en Buren Import</h1>
          <p className="text-muted-foreground mt-2">
            Import monthly sales data from farmers market Excel file
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : step !== 'upload' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'border-primary bg-primary text-white' : step !== 'upload' ? 'border-green-600 bg-green-600 text-white' : 'border-muted'}`}>
              1
            </div>
            <span className="font-medium">Upload</span>
          </div>
          <ChevronRight className="text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step === 'validate' ? 'text-primary' : step === 'execute' || step === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'validate' ? 'border-primary bg-primary text-white' : step === 'execute' || step === 'complete' ? 'border-green-600 bg-green-600 text-white' : 'border-muted'}`}>
              2
            </div>
            <span className="font-medium">Validate</span>
          </div>
          <ChevronRight className="text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step === 'execute' || step === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'execute' || step === 'complete' ? 'border-green-600 bg-green-600 text-white' : 'border-muted'}`}>
              3
            </div>
            <span className="font-medium">Import</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Select the monthly Boeren en Buren Excel file (.xls, .xlsx, or .csv)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-xs">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || parseMutation.isPending}
                >
                  {parseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Parse & Validate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Validate */}
        {step === 'validate' && parsedData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{parsedData.summary.totalRows}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{parsedData.summary.validRows}</div>
                    <div className="text-sm text-muted-foreground">Valid</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{parsedData.summary.errorRows}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{parsedData.summary.warningRows}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{parsedData.summary.uniqueFarms}</div>
                    <div className="text-sm text-muted-foreground">Farms</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unmapped Products Card */}
            {parsedData.unmappedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Unmapped Products ({parsedData.unmappedProducts.length})
                  </CardTitle>
                  <CardDescription>
                    These product references don't have mappings yet. Accept suggestions or map manually.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {parsedData.unmappedProducts.map((suggestion) => (
                      <div key={suggestion.productReference} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{suggestion.productReference}</div>
                            <div className="text-sm text-muted-foreground">{suggestion.productName}</div>
                          </div>
                          <Badge variant={
                            suggestion.confidence === 'high' ? 'default' :
                            suggestion.confidence === 'medium' ? 'secondary' :
                            suggestion.confidence === 'low' ? 'outline' : 'destructive'
                          }>
                            {suggestion.confidence === 'none' ? 'No match' : `${suggestion.confidence} confidence`}
                          </Badge>
                        </div>

                        {suggestion.suggestedProduct && suggestion.suggestedSalesPrice && (
                          <div className="bg-muted/50 rounded p-3 space-y-2">
                            <div className="font-medium text-sm">Suggested Mapping:</div>
                            <div className="text-sm">
                              <div><strong>{suggestion.suggestedProduct.nameDutch}</strong></div>
                              <div className="text-muted-foreground">
                                {suggestion.suggestedSalesPrice.amount}{suggestion.suggestedSalesPrice.unit} - {formatCurrency(parseFloat(suggestion.suggestedSalesPrice.b2cPriceWithVat))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptSuggestion(suggestion)}
                              disabled={saveMappingMutation.isPending}
                            >
                              {saveMappingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Accept Suggestion
                            </Button>
                          </div>
                        )}

                        {suggestion.confidence === 'none' && (
                          <div className="bg-red-50 rounded p-3 text-sm text-red-600">
                            <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                            No matching product found. Please map manually in the mappings admin.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Errors Card */}
            {parsedData.validationErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Validation Errors ({parsedData.validationErrors.length})
                  </CardTitle>
                  <CardDescription>
                    Fix these errors before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.validationErrors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.rowNumber}</TableCell>
                          <TableCell className="font-mono text-sm">{error.field}</TableCell>
                          <TableCell>{error.message}</TableCell>
                          <TableCell>
                            <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                              {error.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canProceed}
              >
                Proceed to Import
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {!canProceed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                Cannot proceed: {parsedData.unmappedProducts.length > 0 && "Map all products first. "}
                {parsedData.summary.errorRows > 0 && "Fix all errors first."}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Import Completed Successfully
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    Import Completed with Errors
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{importResult.salesCreated}</div>
                  <div className="text-sm text-muted-foreground">Sales Created</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{importResult.salesLinesCreated}</div>
                  <div className="text-sm text-muted-foreground">Sales Lines Created</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <div className="font-medium text-red-800">Errors encountered:</div>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Next steps:</strong> All sales have been created with status "NEW".
                Review them in the Orders page, then update the status as needed.
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Import Another File
                </Button>
                <Button onClick={() => window.location.href = '/admin/orders'}>
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Import</AlertDialogTitle>
              <AlertDialogDescription>
                This will create {parsedData?.summary.uniqueFarms} sales with status "NEW" based on the validated data.
                You can review and modify them afterwards. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={executeMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault(); // Prevent dialog from closing
                  handleExecuteImport();
                }}
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {executeMutation.isPending ? 'Importing...' : 'Yes, Import'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
