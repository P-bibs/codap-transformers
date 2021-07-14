import { uncheckedTransformColumn } from "../transformColumn";

// - errors on invalid attribute
// - errors when formula evaluates to type that violates contract
// - transformed attribute's formula is erased, description set
// - all other metadata is copied
// - transform dataset w/ no records does nothing but modify attr
