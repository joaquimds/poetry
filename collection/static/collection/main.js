const $form = document.querySelector('form')
const $search = $form.querySelector('input')
const $container = document.querySelector('main ul')
const $spinner = document.getElementById('spinner')

const debounce = (callback) => {
    let timeout = null
    return () => {
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
            callback()
        }, 200)
    }
}

const search = async () => {
    $spinner.style.display = 'block'
    const search = $search.value
    const response = await fetch(`/api/poems?s=${encodeURIComponent(search)}`)
    const poems = await response.json()
    render(poems)
    $spinner.style.display = 'none'
}

const masonry = new window.Masonry($container, {
    itemSelector: '.grid-item'
})

window.addEventListener('click', (e) => {
    const $items = $container.querySelectorAll('article')
    for (const $item of $items) {
        if ($item.contains(e.target)) {
            const $link = $item.querySelector('a')
            if (!$link.contains(e.target)) {
                e.preventDefault()
                if ($item.getAttribute('data-focussed')) {
                    $item.style.zIndex = 3;
                    $item.removeAttribute('data-focussed')
                    $item.addEventListener("transitionend", () => {
                        $item.style.zIndex = ""
                    })
                } else {
                    $item.setAttribute('data-focussed', true)
                }
            }
        } else {
            $item.removeAttribute('data-focussed')
        }
    }
})

let items = {}
const render = (poems) => {
    const toRemove = []
    const toAdd = []

    for (const id of Object.keys(items)) {
        const matching = poems.filter(p => p.id === Number(id))
        if (!matching.length) {
            toRemove.push(items[id])
            delete items[id]
        }
    }

    for (const poem of poems) {
        if (!items[poem.id]) {
            toAdd.push(poem)
        }
    }

    masonry.remove(toRemove)
    masonry.layout()

    const added = []
    for (const poem of toAdd) {
        const $item = document.createElement('li')
        const $article = document.createElement('article')
        const $overlay = document.createElement('div')
        const $link = document.createElement('a')
        const $title = document.createElement('h2')
        const $image = document.createElement('img')
        const $author = document.createElement('h3')

        $item.setAttribute('class', 'grid-item')
        $overlay.setAttribute('class', 'overlay')
        $title.innerText = poem.title
        $image.setAttribute('src', poem.image)
        $image.setAttribute('alt', poem.body)
        $author.innerText = poem.author
        $link.setAttribute('href', poem.link)
        $link.setAttribute('target', '_blank')

        $overlay.addEventListener('mouseenter', () => {
            $overlay.setAttribute('data-visible', true)
        })

        $overlay.addEventListener('mouseleave', () => {
            $overlay.removeAttribute('data-visible')
        })

        $link.addEventListener('mouseenter', () => {
            $overlay.setAttribute('data-force-visible', true)
        })

        $link.addEventListener('mouseleave', () => {
            $overlay.removeAttribute('data-force-visible')
        })

        $image.addEventListener('load', () => {
            masonry.layout()
        })

        $image.addEventListener('error', () => {
            masonry.layout()
        })

        $link.appendChild($title)
        $link.appendChild($author)
        $overlay.appendChild($link)
        $article.appendChild($image)
        $article.appendChild($overlay)

        $item.appendChild($article)
        $container.appendChild($item)
        items[poem.id] = $item
        added.push($item)
    }
    masonry.appended(added)
}

$form.addEventListener("submit", (e) => {
    e.preventDefault()
    search()
})

$search.addEventListener("input", debounce(() => {
    search()
}))

search()
