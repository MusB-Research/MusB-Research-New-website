from django.contrib import admin

admin.site.site_header = "MusB Research Command Center"
admin.site.site_title = "MusB Super Admin"
admin.site.index_title = "Platform Governance"

from django.contrib import admin
from .models import Study, StudyAssignment, Participant, Visit, Kit, Form, FormResponse, BookletDownloadRequest

class StudyAssignmentInline(admin.TabularInline):
    model = StudyAssignment
    extra = 1

@admin.register(Study)
class StudyAdmin(admin.ModelAdmin):
    list_display = ('protocol_id', 'title', 'status', 'study_type', 'sponsor_name')
    list_filter = ('status', 'study_type')
    search_fields = ('protocol_id', 'title', 'sponsor_name')
    inlines = [StudyAssignmentInline]

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('participant_sid', 'study', 'status', 'user')
    list_filter = ('status', 'study')
    search_fields = ('participant_sid', 'user__email', 'user__full_name')

admin.site.register(Visit)
admin.site.register(Kit)
admin.site.register(Form)
admin.site.register(FormResponse)
admin.site.register(BookletDownloadRequest)
