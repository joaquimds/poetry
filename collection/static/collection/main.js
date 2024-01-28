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

const undebounce = (callback) => {
    let skip = false
    return (...args) => {
        if (!skip) {
            skip = true
            callback(...args)
            setTimeout(() => {
                skip = false
            }, 200)
        }
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


const getTransformOrigin = ($item) => {
    const windowWidth = window.innerWidth
    if (windowWidth < 600) {
        return 'center'
    }
    const $parent = $item.closest('li')
    const left = Number($parent.style.left.replace('px', ''))
    if (windowWidth < 900) {
        return left < 1 ? 'left' : 'right'
    }
    const halfWidth = Math.floor(windowWidth / 3)
    if (left === 0) {
        return 'left'
    }
    if (left > halfWidth) {
        return 'right'
    }
    return 'center'
}

const doArticleStateTransition = undebounce(($article) => {
    const state = $article.getAttribute('data-state') || 'default'
    let nextState = 'default'
    switch (state) {
        case 'default':
            nextState = 'focussed'
            break
        case 'focussed':
            nextState = 'attribution'
            break
        case 'attribution':
        default:
    }
    $article.setAttribute('data-state', nextState)
})

window.addEventListener('click', (e) => {
    const $articles = $container.querySelectorAll('article')
    for (const $article of $articles) {
        if ($article.contains(e.target)) {
            $link = $article.querySelector('a')
            if (!$link.contains(e.target)) {
                doArticleStateTransition($article)
            }
        } else {
            $article.removeAttribute('data-state')
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

        $article.addEventListener('mouseenter', () => {
            doArticleStateTransition($article)
        })

        $article.addEventListener('mouseleave', () => {
            $article.removeAttribute('data-state')
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
