# Claiming
## Purpose
Give one person exclusive access to a resource.
## Principle
A resource becomes available; one claimer atomically reserves it; its claimer later completes or releases the claim. Releasing makes the resource available to another claimer.
## Types

```types
external Claimer
  An identity reserving a resource.
external Resource
  A resource supplied by the application.
```

## State
```state
a set of Resources with
  a status String
  a claimer Claimer
```
## Actions
```actions
makeAvailable (resource: Resource) : returns (resource: Resource)
  where resource already exists
  then
    refuses CLAIM_UNAVAILABLE "This item already has an availability record."
  where resource is new
  then
    add resource as available with no claimer
    returns resource
claim (claimer: Claimer, resource: Resource) : returns (resource: Resource)
  where resource is not available
  then
    refuses CLAIM_UNAVAILABLE "This item is no longer available."
  where resource is available
  then
    atomically set status to claimed and claimer to claimer
    returns resource
release (claimer: Claimer, resource: Resource) : returns (resource: Resource)
  where resource is not claimed by claimer
  then
    refuses CLAIM_UNAVAILABLE "Only the current claimer can release a reserved item."
  where resource is claimed by claimer
  then
    set status to available and clear claimer
    returns resource
complete (claimer: Claimer, resource: Resource) : returns (resource: Resource)
  where resource is not claimed by claimer
  then
    refuses CLAIM_UNAVAILABLE "This claim cannot be completed."
  where resource is claimed by claimer
  then
    set status to completed
    returns resource
```
## Queries
```queries
_get (resource: Resource) : optional (status: String, claimer: Claimer)
  answers current status and claimer or no rows when missing; empty claimer represents unclaimed
```



