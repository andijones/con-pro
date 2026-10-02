"use client";

import { useState } from "react";
import { AlertTriangle, Bold, Calendar as CalendarIcon, Check, ChevronDown, FileText, Info, Italic, Mail, Plus, Search, Underline, Upload } from "lucide-react";
import { toast } from "sonner";
import { decisions } from "@/lib/data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClauseLink, ConfidenceBadge, Countdown, ExtractionBadge, PersonAvatar, Stat, StatusBadge, ToneBadge } from "./primitives";
import { DecisionList } from "./decision-list";
import { gallerySections, slug } from "./gallery-sections";


function Section({ title, file, children }: { title: (typeof gallerySections)[number]; file?: string; children: React.ReactNode }) {
  return (
    <section id={slug(title)} className="scroll-mt-20">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {file && <code className="text-xs text-muted-foreground">{file}</code>}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Specimen({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className={className ?? "flex flex-wrap items-center gap-3"}>{children}</div>
    </div>
  );
}

export function ComponentGallery() {
  const [progress, setProgress] = useState(45);

  return (
    <div className="flex flex-col gap-14">
      <Section title="Buttons" file="ui/button.tsx · ui/button-group.tsx · ui/toggle.tsx">
        <Specimen label="Variants">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </Specimen>
        <Specimen label="Sizes">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Search">
            <Search />
          </Button>
        </Specimen>
        <Specimen label="With icons, loading, disabled">
          <Button>
            <Upload data-icon="inline-start" /> Upload contract
          </Button>
          <Button variant="outline">
            Continue <ChevronDown data-icon="inline-end" />
          </Button>
          <Button disabled>
            <Spinner /> Reading…
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </Specimen>
        <Specimen label="Groups and toggles">
          <ButtonGroup>
            <Button variant="outline">Day</Button>
            <Button variant="outline">Week</Button>
            <Button variant="outline">Month</Button>
          </ButtonGroup>
          <ToggleGroup type="multiple" variant="outline">
            <ToggleGroupItem value="b" aria-label="Bold">
              <Bold />
            </ToggleGroupItem>
            <ToggleGroupItem value="i" aria-label="Italic">
              <Italic />
            </ToggleGroupItem>
            <ToggleGroupItem value="u" aria-label="Underline">
              <Underline />
            </ToggleGroupItem>
          </ToggleGroup>
          <Toggle aria-label="Watch">Watch quietly</Toggle>
        </Specimen>
      </Section>

      <Section title="Badges" file="ui/badge.tsx (+ success, warning, critical)">
        <Specimen label="shadcn variants">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </Specimen>
        <Specimen label="Status variants: always with a label or icon">
          <ToneBadge tone="success">Verified</ToneBadge>
          <ToneBadge tone="warning">Review due</ToneBadge>
          <ToneBadge tone="critical">Issue found</ToneBadge>
        </Specimen>
        <Specimen label="Contract status (StatusBadge)">
          {(["Awaiting upload", "Draft", "Under review", "Legal review", "Active", "Expired", "Terminated", "Archived", "Deleted"] as const).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </Specimen>
        <Specimen label="Extraction and confidence">
          <ExtractionBadge state="Ready to review" />
          <ExtractionBadge state="Reading" />
          <ConfidenceBadge value={91} />
          <ConfidenceBadge value={57} />
          <ConfidenceBadge value={22} />
          <ConfidenceBadge value={0} />
        </Specimen>
      </Section>

      <Section title="Cards" file="ui/card.tsx">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Managed equipment service: imaging</CardTitle>
              <CardDescription>Halden Medical Systems Ltd · Clinical</CardDescription>
              <CardAction>
                <StatusBadge status="Active" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Give written notice by 17 October 2026 or the contract renews for another 12 months, worth about £4.2m.</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Prepare decision paper</Button>
              <Button size="sm" variant="ghost">
                Assign
              </Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Small card</CardTitle>
              <CardDescription>size=&quot;sm&quot; tightens the spacing token</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Stat value="£4.3m" label="Committed if nobody gives notice" />
              <Stat value="£224k" label="Money found" tone="success" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Forms" file="ui/field.tsx · input · textarea · input-group · select">
        <div className="grid gap-6 md:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="g-title">Contract title</FieldLabel>
              <Input id="g-title" placeholder="e.g. Linen and laundry services" />
              <FieldDescription>As it should appear in reports.</FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="g-value">Total value</FieldLabel>
              <Input id="g-value" aria-invalid defaultValue="£4,2m" />
              <FieldError>Enter an amount like £4,200,000.</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-search">With add-ons</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Mail />
                </InputGroupAddon>
                <InputGroupInput id="g-search" placeholder="name@trust.nhs.uk" />
              </InputGroup>
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="g-type">Contract type</FieldLabel>
              <Select>
                <SelectTrigger id="g-type" className="w-full">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="estates">Estates & Facilities</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-note">Note</FieldLabel>
              <Textarea id="g-note" placeholder="Anything the reviewer should look at" />
            </Field>
            <Field>
              <FieldLabel htmlFor="g-disabled">Disabled</FieldLabel>
              <Input id="g-disabled" disabled defaultValue="Read from the document" />
            </Field>
          </FieldGroup>
        </div>
      </Section>

      <Section title="Selection" file="checkbox · radio-group · switch · slider · calendar">
        <div className="grid gap-6 md:grid-cols-3">
          <Specimen label="Checkbox and switch" className="flex flex-col gap-3">
            <Label>
              <Checkbox defaultChecked /> Include attachments
            </Label>
            <Label>
              <Checkbox /> Only active contracts
            </Label>
            <Label>
              <Switch defaultChecked /> Email me about notice deadlines
            </Label>
            <Label>
              <Switch /> Email me about price rises
            </Label>
          </Specimen>
          <Specimen label="Radio group" className="flex flex-col gap-3">
            <RadioGroup defaultValue="week">
              {[
                ["now", "As it happens"],
                ["week", "Weekly summary"],
                ["never", "Only in the app"],
              ].map(([v, l]) => (
                <Label key={v}>
                  <RadioGroupItem value={v} /> {l}
                </Label>
              ))}
            </RadioGroup>
          </Specimen>
          <Specimen label="Slider and progress" className="flex flex-col gap-4">
            <Slider value={[progress]} onValueChange={([v]) => setProgress(v)} max={100} aria-label="Progress" />
            <Progress value={progress} aria-label="Fields reviewed" />
            <span className="tnum text-xs text-muted-foreground">{progress}% reviewed</span>
          </Specimen>
        </div>
        <Specimen label="Calendar">
          <Card className="w-fit py-0">
            <Calendar mode="single" selected={new Date(2026, 9, 17)} defaultMonth={new Date(2026, 9, 1)} />
          </Card>
        </Specimen>
      </Section>

      <Section title="Overlays" file="dialog · alert-dialog · sheet · drawer · popover · tooltip · hover-card">
        <Specimen label="Click to open">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload a contract</DialogTitle>
                <DialogDescription>Dialogs are for tasks. Use an alert dialog to confirm something destructive.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Create and upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Alert dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this contract?</AlertDialogTitle>
                <AlertDialogDescription>The audit trail keeps a record that it existed and who deleted it.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Sheets hold secondary panels, like filters on a phone.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Clause 3.2 · Extension</DrawerTitle>
                <DrawerDescription>Drawers slide up from the bottom, which suits evidence on a phone.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Open contract</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon data-icon="inline-start" /> Popover
              </Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">Popovers hold small pickers and history.</PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Show in document</TooltipContent>
          </Tooltip>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">Hover card</Button>
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
              <p className="font-medium">Halden Medical Systems Ltd</p>
              <p className="mt-1 text-muted-foreground">2 contracts · £4.9m a year</p>
            </HoverCardContent>
          </HoverCard>
          <Button variant="outline" onClick={() => toast.success("Details saved", { description: "Sonner toast", action: { label: "Undo", onClick: () => {} }, duration: Infinity })}>
            Toast
          </Button>
        </Specimen>
      </Section>

      <Section title="Menus and commands" file="dropdown-menu · command · kbd">
        <div className="grid gap-6 md:grid-cols-2">
          <Specimen label="Dropdown menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <ChevronDown data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Contract</DropdownMenuLabel>
                <DropdownMenuItem>
                  Open contract <DropdownMenuShortcut>↵</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>Review what the AI read</DropdownMenuItem>
                <DropdownMenuItem>Edit details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Specimen>
          <Specimen label="Command" className="block">
            <Command className="rounded-lg shadow-xs">
              <CommandInput placeholder="Find a contract…" />
              <CommandList>
                <CommandEmpty>Nothing found.</CommandEmpty>
                <CommandGroup heading="Contracts">
                  <CommandItem>
                    <FileText /> Managed equipment service: imaging
                  </CommandItem>
                  <CommandItem>
                    <FileText /> Pathology analysers and reagent rental
                  </CommandItem>
                  <CommandItem>
                    <Search /> Ask a question <CommandShortcut>⌘K</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Specimen>
        </div>
      </Section>

      <Section title="Navigation" file="tabs · breadcrumb · pagination · accordion">
        <Specimen label="Tabs" className="block">
          <Tabs defaultValue="ask">
            <TabsList>
              <TabsTrigger value="ask">Ask a question</TabsTrigger>
              <TabsTrigger value="foi">FOI request</TabsTrigger>
            </TabsList>
            <TabsContent value="ask" className="pt-2 text-sm text-muted-foreground">
              Tab content
            </TabsContent>
            <TabsContent value="foi" className="pt-2 text-sm text-muted-foreground">
              FOI content
            </TabsContent>
          </Tabs>
          <Tabs defaultValue="all" className="mt-4">
            <TabsList variant="line">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="decisions">Needs a decision</TabsTrigger>
              <TabsTrigger value="check">Details to check</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-2 text-sm text-muted-foreground">
              Line variant
            </TabsContent>
            <TabsContent value="decisions" className="pt-2 text-sm text-muted-foreground">
              Decisions
            </TabsContent>
            <TabsContent value="check" className="pt-2 text-sm text-muted-foreground">
              To check
            </TabsContent>
          </Tabs>
        </Specimen>
        <Specimen label="Breadcrumb and pagination">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Contracts</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Imaging MES</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Specimen>
        <Specimen label="Accordion" className="block max-w-xl">
          <Accordion type="single" collapsible>
            <AccordionItem value="a">
              <AccordionTrigger>What counts as a “decision”?</AccordionTrigger>
              <AccordionContent>A dated action with a consequence if nobody takes it: a notice period, an objection window, a route choice.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Why are some values “not held”?</AccordionTrigger>
              <AccordionContent>Contravo never fills a gap with a guess. If the document doesn’t say, neither do we.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Specimen>
      </Section>

      <Section title="Feedback" file="alert · empty · skeleton · spinner · progress">
        <div className="grid gap-4 md:grid-cols-2">
          <Alert>
            <Info />
            <AlertTitle>What this answer can’t tell you</AlertTitle>
            <AlertDescription>Termination clauses have only been extracted for 3 of 13 contracts.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Resolve before sending</AlertTitle>
            <AlertDescription>Values disagree between the register and the signed schedule.</AlertDescription>
          </Alert>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No contracts match</EmptyTitle>
              <EmptyDescription>Try clearing the filters, or ask a question instead.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <Spinner /> Reading 13 contracts…
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Data display" file="table · avatar · item · separator">
        <Card className="py-0">
          <Table scrollLabel="Example contracts table">
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="pl-4">Contract</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="pr-4 text-right">Annual value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="pl-4 font-medium">Managed equipment service: imaging</TableCell>
                <TableCell>
                  <StatusBadge status="Active" />
                </TableCell>
                <TableCell>
                  <PersonAvatar id="amara" />
                </TableCell>
                <TableCell className="tnum pr-4 text-right">£4,200,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-4 font-medium">Endoscopy decontamination service</TableCell>
                <TableCell>
                  <StatusBadge status="Draft" />
                </TableCell>
                <TableCell>
                  <PersonAvatar id={null} />
                </TableCell>
                <TableCell className="pr-4 text-right text-muted-foreground">Not held</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Item variant="outline">
            <ItemMedia variant="icon">
              <FileText />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Linen and laundry services</ItemTitle>
              <ItemDescription>Uploaded 30 Sept 2026 · 28 pages</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Open
              </Button>
            </ItemActions>
          </Item>
          <div className="flex items-center gap-4">
            <AvatarGroup>
              {["PS", "TR", "AO", "SW"].map((i) => (
                <Avatar key={i}>
                  <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{i}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <Separator orientation="vertical" className="h-8!" />
            <span className="text-sm text-muted-foreground">One shared truth for every team</span>
          </div>
        </div>
      </Section>

      <Section title="Contravo composites" file="components/contravo/*">
        <Specimen label="Countdown: the deadline is the most visible thing on a screen">
          <Card className="px-5">
            <Countdown date="2026-10-08" label="Objection window closes" />
          </Card>
          <Card className="px-5">
            <Countdown date="2026-10-17" label="Notice deadline" />
          </Card>
          <Card className="px-5">
            <Countdown date="2026-12-01" label="Decision needed by" />
          </Card>
          <Countdown date="2026-10-16" size="sm" />
        </Specimen>
        <Specimen label="Evidence: every insight links to its clause">
          <ClauseLink contractId="mes-imaging" clause="3.2" />
          <ClauseLink contractId="path-reagents" clause="11.4" contractTitle="Pathology analysers" />
        </Specimen>
        <Specimen label="Decision card" className="block">
          <DecisionList items={decisions.filter((d) => d.id === "d-path-uplift")} />
        </Specimen>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-3.5 text-success" aria-hidden /> Built only from shadcn primitives and semantic tokens, so a token change reaches them too.
        </p>
      </Section>
    </div>
  );
}
