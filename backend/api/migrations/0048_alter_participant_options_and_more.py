from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_alter_event_options_alter_news_options_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='participant',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='participant',
            index=models.Index(fields=['user', '-created_at'], name='api_partici_user_id_b126ce_idx'),
        ),
        migrations.AddIndex(
            model_name='participant',
            index=models.Index(fields=['study', 'status'], name='api_partici_study_i_fa7db7_idx'),
        ),
        migrations.AddIndex(
            model_name='participant',
            index=models.Index(fields=['study', 'user'], name='api_partici_study_i_5c312e_idx'),
        ),
    ]
