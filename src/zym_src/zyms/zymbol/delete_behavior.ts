export enum DeleteBehaviorType {
  /* Can't delete the zymbol from the current cursor position */
  FORBIDDEN = "forbidden",
  /* We can simply delete this zymbol like any character */
  ALLOWED = "allowed",
  /* Allows the child to perform a deflect delete, but the cursor position remains unchanged */
  DEFLECT = "deflect",
}

type NormalBehavior = DeleteBehaviorType.FORBIDDEN | DeleteBehaviorType.ALLOWED;

export function normalDeleteBehavior(behavior: NormalBehavior): DeleteBehavior {
  return {
    type: behavior,
  };
}

type NormalDeleteBehavior = {
  type: NormalBehavior;
};

type DeflectDeleteBehavior = {
  type: DeleteBehaviorType.DEFLECT;
  deflectedZymbolBehavior: DeleteBehavior;
};

export function deflectDeleteBehavior(
  deflectedZymbolBehavior: DeleteBehavior
): DeleteBehavior {
  return {
    type: DeleteBehaviorType.DEFLECT,
    deflectedZymbolBehavior,
  };
}

export type DeleteBehavior = NormalDeleteBehavior | DeflectDeleteBehavior;
