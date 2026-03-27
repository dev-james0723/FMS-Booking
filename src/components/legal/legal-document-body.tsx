import type { LegalSection } from "@/lib/legal/types";

type Props = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocumentBody({ title, intro, sections }: Props) {
  return (
    <>
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{intro}</p>
      <div className="mt-10 space-y-9">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
