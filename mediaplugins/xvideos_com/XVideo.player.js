let getSiblings = n => [...n.parentElement.children].filter(c=>c!=n)
function removeElementExcept(survivor) {
    if (!survivor) return;
    const parent = survivor.parentElement;
    if (survivor === document || !parent) return;
    const siblings = getSiblings(survivor);
    for (const sibling of siblings) {
    if (sibling.tagName === 'HEAD') continue;
        sibling.style.display = "none";
    }
    removeElementExcept(parent);
}
removeElementExcept(document.getElementById("html5video"));