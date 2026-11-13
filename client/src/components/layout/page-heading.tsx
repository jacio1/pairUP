export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
