from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=128)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=128)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Poem(models.Model):
    title = models.CharField(max_length=128)
    body = models.TextField()
    image = models.ImageField()
    author = models.ForeignKey(to=Author, on_delete=models.PROTECT)
    tags = models.ManyToManyField(to=Tag)
    link = models.CharField(max_length=1024, blank=True)

    def __str__(self):
        return f"{self.title} by {self.author}"
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "image": self.image.url,
            "author": self.author.name,
            "tags": [tag.name for tag in self.tags.order_by('name')],
            "link": self.link
        }
