from django.http import JsonResponse
from django.db.models import Q
from django.shortcuts import render

from collection.models import Poem


def index(request):
    return render(request, "collection/index.html")


def poems(request):
    search = request.GET.get("s", "")
    if not search:
        poems = Poem.objects.all()
    else:
        poems = Poem.objects.filter(
            Q(title__icontains=search)
            | Q(body__icontains=search)
            | Q(author__name__icontains=search)
            | Q(tags__name__icontains=search)
        )

    poems = poems.order_by("title", "author__name").distinct()

    return JsonResponse([poem.to_dict() for poem in poems], safe=False)
