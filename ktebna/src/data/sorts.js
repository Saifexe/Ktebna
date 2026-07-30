// NOTE: the original sorts.js could not be recovered (corrupted in the
// uploaded archive) and wasn't referenced by any of the files that did
// extract successfully. This is a reasonable reconstruction covering the
// common "newest/oldest" sort used on the home feed - adjust if your
// original had different options.
const SORTS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
];

export default SORTS;
