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
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer'
})

window.addEventListener('click', (e) => {
    const $items = $container.querySelectorAll('article')
    for (const $item of $items) {
        if ($item.contains(e.target)) {
            if (!$item.getAttribute('data-focussed')) {
                e.preventDefault()
                $item.setAttribute('data-focussed', true)
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
        const $overlay = document.createElement('a')
        const $title = document.createElement('h2')
        const $image = document.createElement('img')
        const $author = document.createElement('h3')

        $item.setAttribute('class', 'grid-item')
        $overlay.setAttribute('class', 'overlay')
        $overlay.setAttribute('href', poem.link)
        $overlay.setAttribute('target', '_blank')
        $title.innerText = poem.title
        $image.setAttribute('src', poem.image)
        $image.setAttribute('alt', poem.body)
        $author.innerText = poem.author

        $overlay.addEventListener('mouseenter', () => {
            $overlay.style.opacity = 1
        })

        $overlay.addEventListener('mouseleave', () => {
            $overlay.style.opacity = 0
        })

        $image.addEventListener('load', () => {
            masonry.layout()
        })

        $image.addEventListener('error', () => {
            masonry.layout()
        })

        $overlay.appendChild($title)
        $overlay.appendChild($author)
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
