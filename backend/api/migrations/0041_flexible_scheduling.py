from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_innovationpagesettings_sponsorinquiry_technology_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='studyquestionnaire',
            name='frequency_interval',
            field=models.IntegerField(default=1, help_text='Number of units between occurrences'),
        ),
        migrations.AddField(
            model_name='studyquestionnaire',
            name='frequency_unit',
            field=models.CharField(choices=[('DAYS', 'Days'), ('WEEKS', 'Weeks'), ('MONTHS', 'Months')], default='WEEKS', max_length=10),
        ),
        migrations.AlterField(
            model_name='studyquestionnaire',
            name='repeat_count',
            field=models.IntegerField(default=1, help_text='Total number of times to repeat'),
        ),
        migrations.AlterField(
            model_name='studyquestionnaire',
            name='repeat_type',
            field=models.CharField(choices=[('DAILY', 'Daily'), ('WEEKLY', 'Weekly'), ('MONTHLY', 'Monthly'), ('CUSTOM', 'Custom')], default='MONTHLY', help_text='Deprecated: Use frequency_interval and frequency_unit instead.', max_length=20),
        ),
    ]
