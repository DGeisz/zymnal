export interface GroupId {
  group: string;
  item: string | number;
}

export type SubId = number;

export interface ZySub<A> {
  id: SubId;
  sub: (args: A) => void;
}
