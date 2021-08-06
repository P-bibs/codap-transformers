import { deleteComponent, getInteractiveFrame } from "../lib/codapPhone";
import { TransformationDescription } from "../transformerStore/types";

export async function closePlugin(
  activeTransformations: Record<string, TransformationDescription[]>
): Promise<void> {
  if (
    Object.keys(activeTransformations).length === 0 ||
    confirm(
      `Closing the transformers plugin will stop transformed datasets from updating. Are you sure you'd like to proceed?`
    )
  ) {
    const id = (await getInteractiveFrame()).id;
    deleteComponent(id.toString());
  }
}
