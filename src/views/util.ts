import { deleteComponent, getInteractiveFrame } from "../lib/codapPhone";

export async function closePlugin(isSavedTransformer: boolean): Promise<void> {
  const customMessage = isSavedTransformer
    ? `Closing this Transformer will delete it permanently and stop any datasets it produced from updating.`
    : `Closing the Transformers plugin will stop any transformed datasets from updating.`;

  if (
    confirm(
      `${customMessage} If you'd like to temporarily hide it, consider using ` +
        `the minimize button instead.\n\nAre you sure you'd like to proceed?`
    )
  ) {
    const id = (await getInteractiveFrame()).id;
    deleteComponent(id.toString());
  }
}
