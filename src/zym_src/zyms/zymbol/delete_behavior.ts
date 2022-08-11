export enum DeleteBehaviorType {
  /* Can't delete the zymbol from the current cursor position */
  FORBIDDEN = "forbidden",
  /* We can simply delete this zymbol like any character */
  ALLOWED = "allowed",
  /* Allows the child to perform a deflect delete, but the cursor position remains unchanged */
  DEFLECT = "deflect",
  /* Takes the children and adds them to the underlying children */
  SPLICE = "splice",
  /* The prev zymbol wants the cursor */
  ABSORB = "absorb",
  MOVE_LEFT = "move_left",
}

type NormalBehavior =
  | DeleteBehaviorType.FORBIDDEN
  | DeleteBehaviorType.MOVE_LEFT
  | DeleteBehaviorType.ABSORB
  | DeleteBehaviorType.ALLOWED
  | DeleteBehaviorType.SPLICE;

export function deleteBehaviorNormal(behavior: NormalBehavior): DeleteBehavior {
  return {
    type: behavior,
  };
}

type deleteBehaviorNormal = {
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

export type DeleteBehavior = deleteBehaviorNormal | DeflectDeleteBehavior;
