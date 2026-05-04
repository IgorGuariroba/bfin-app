import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-canvas">
      <h1 className="text-3xl font-semibold text-ink">bfin tema teste</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <Button>Primary (Rausch)</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <div className="grid grid-cols-5 gap-4 text-center text-sm">
        <div className="rounded-lg bg-rausch p-4 text-on-primary font-medium">rausch<br />#ff385c</div>
        <div className="rounded-lg bg-ink p-4 text-white font-medium">ink<br />#222222</div>
        <div className="rounded-lg bg-surface-soft p-4 text-ink font-medium">surface-soft<br />#f7f7f7</div>
        <div className="rounded-lg bg-surface-strong p-4 text-ink font-medium">surface-strong<br />#f2f2f2</div>
        <div className="rounded-lg bg-muted p-4 text-ink font-medium">muted<br />#6a6a6a</div>
      </div>

      <p className="text-muted text-sm">
        Inter font · radius 8px · Tailwind v4 + shadcn
      </p>
    </div>
  );
}
