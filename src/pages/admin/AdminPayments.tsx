import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Search,
  RefreshCw,
  User,
  Receipt,
  RotateCcw,
  ExternalLink,
  Loader2,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getPlanDisplayName } from "@/lib/stripe";

interface Customer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  subscription: {
    id: string;
    status: string;
    plan: string;
    current_period_end: number;
  } | null;
  balance: number;
  currency: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string | null;
  refunded: boolean;
  refund_amount: number;
}

interface Invoice {
  id: string;
  number: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
  pdf: string | null;
}

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  plan: {
    id: string;
    amount: number | null;
    interval: string | null;
    product: string;
  };
}

interface CustomerDetails {
  customer: Customer | null;
  payments: Payment[];
  invoices: Invoice[];
  subscriptions: Subscription[];
}

export default function AdminPayments() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Refund dialog state
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    paymentId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  // Cancel subscription dialog
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    subscriptionId: string;
  } | null>(null);
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    }
  }, [isAdmin]);

  const fetchCustomers = async (email?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-customers", {
        body: { limit: 50, email: email || undefined },
      });

      if (error) throw error;
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-customer-payments", {
        body: { customer_id: customerId },
      });

      if (error) throw error;
      setCustomerDetails(data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers(searchEmail);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer.id);
  };

  const handleRefund = async () => {
    if (!refundDialog) return;

    setProcessingRefund(true);
    try {
      const amount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
      
      const { data, error } = await supabase.functions.invoke("admin-refund-payment", {
        body: {
          payment_intent_id: refundDialog.paymentId,
          amount,
          reason: refundReason || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Refund Processed",
        description: `Refund of ${formatCurrency(data.refund.amount, data.refund.currency)} processed successfully`,
      });

      setRefundDialog(null);
      setRefundAmount("");
      setRefundReason("");

      // Refresh customer details
      if (selectedCustomer) {
        fetchCustomerDetails(selectedCustomer.id);
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Refund Failed",
        description: error instanceof Error ? error.message : "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelDialog) return;

    setProcessingCancel(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-cancel-subscription", {
        body: {
          subscription_id: cancelDialog.subscriptionId,
          cancel_immediately: cancelImmediately,
        },
      });

      if (error) throw error;

      toast({
        title: "Subscription Canceled",
        description: cancelImmediately 
          ? "Subscription canceled immediately" 
          : "Subscription will cancel at period end",
      });

      setCancelDialog(null);
      setCancelImmediately(false);

      // Refresh customer details
      if (selectedCustomer) {
        fetchCustomerDetails(selectedCustomer.id);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setProcessingCancel(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      active: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
      succeeded: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
      paid: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
      trialing: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      pending: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      processing: { variant: "secondary", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      canceled: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
      failed: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
      past_due: { variant: "destructive", icon: <AlertTriangle className="w-3 h-3" /> },
    };

    const config = variants[status] || { variant: "outline" as const, icon: null };

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to view this page.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payment Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer payments, subscriptions, and refunds
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Customers</CardTitle>
              <CardDescription>Search and select a customer to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => fetchCustomers()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Customer List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : customers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No customers found</p>
                ) : (
                  customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleViewCustomer(customer)}
                      className={`w-full p-3 rounded-lg text-left transition-colors border ${
                        selectedCustomer?.id === customer.id
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.email || "No email"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {customer.name || "No name"} • {formatDate(customer.created)}
                          </p>
                        </div>
                        {customer.subscription && (
                          <Badge variant={customer.subscription.status === 'active' ? "default" : "secondary"} className="shrink-0 text-xs">
                            {customer.subscription.status}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCustomer ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a customer to view their details</p>
                </div>
              ) : loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : customerDetails ? (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedCustomer.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedCustomer.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Customer ID</p>
                        <p className="font-mono text-sm">{selectedCustomer.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(selectedCustomer.created)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions */}
                  {customerDetails.subscriptions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Subscriptions
                        </h3>
                        <div className="space-y-3">
                          {customerDetails.subscriptions.map((sub) => (
                            <div key={sub.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {getStatusBadge(sub.status)}
                                    {sub.cancel_at_period_end && (
                                      <Badge variant="outline" className="text-destructive border-destructive">
                                        Cancels at period end
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium">
                                    {getPlanDisplayName(sub.plan.id?.includes("price_1SuvL6") ? "pro" : sub.plan.id?.includes("price_1SuvLR") ? "enterprise" : null)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {sub.plan.amount ? formatCurrency(sub.plan.amount, "usd") : "N/A"}/{sub.plan.interval}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Period: {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                                  </p>
                                </div>
                                {sub.status === 'active' && !sub.cancel_at_period_end && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => setCancelDialog({ open: true, subscriptionId: sub.id })}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Payments */}
                  {customerDetails.payments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Payment History
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerDetails.payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.created)}</TableCell>
                                <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                <TableCell className="text-right">
                                  {payment.status === 'succeeded' && !payment.refunded && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRefundDialog({
                                        open: true,
                                        paymentId: payment.id,
                                        amount: payment.amount,
                                        currency: payment.currency,
                                      })}
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Refund
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}

                  {/* Invoices */}
                  {customerDetails.invoices.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Invoices
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerDetails.invoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell>
                                  <span className="font-mono text-sm">{invoice.number || invoice.id.slice(0, 12)}</span>
                                </TableCell>
                                <TableCell>{formatCurrency(invoice.amount_due, invoice.currency)}</TableCell>
                                <TableCell>{getStatusBadge(invoice.status || "unknown")}</TableCell>
                                <TableCell className="text-right">
                                  {invoice.hosted_invoice_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                    >
                                      <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View
                                      </a>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={() => setRefundDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment {refundDialog?.paymentId.slice(0, 12)}... 
              (Max: {refundDialog ? formatCurrency(refundDialog.amount, refundDialog.currency) : ""})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Refund Amount (leave empty for full refund)</label>
              <Input
                type="number"
                step="0.01"
                placeholder={refundDialog ? (refundDialog.amount / 100).toFixed(2) : ""}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                  <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={processingRefund}>
              {processingRefund ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Choose how to cancel this subscription
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant={!cancelImmediately ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCancelImmediately(false)}
              >
                Cancel at Period End
              </Button>
              <Button
                variant={cancelImmediately ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setCancelImmediately(true)}
              >
                Cancel Immediately
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {cancelImmediately
                ? "The subscription will be canceled immediately and the customer will lose access right away."
                : "The subscription will remain active until the current period ends."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={processingCancel}
            >
              {processingCancel ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
