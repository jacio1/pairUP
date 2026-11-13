"use client";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useTranslations } from "next-intl";
export function DiscoverHero() {
  const t = useTranslations("Design"),
    p = useTranslations("Product");
  return (
    <section className="discover-hero">
      <div className="min-w-0 max-w-2xl">
        <h1 className="display-title">{p("discoverTitle")}</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
          {t("discoverIntro")}
        </p>
      </div>
      <figure className="neuron-desk">
        <div aria-hidden="true" className="desk-bookmark" />
        <NeuronMascot className="relative z-10 size-28 sm:size-40 lg:size-48" />
        <figcaption className="relative z-10 max-w-40">
          <strong className="block text-sm font-bold sm:text-base">
            {t("neuronTitle")}
          </strong>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {t("neuronCaption")}
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
