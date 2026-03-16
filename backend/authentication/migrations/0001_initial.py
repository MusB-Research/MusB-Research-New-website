# Generated for authentication app models: User, OTP, MagicLink

import django.contrib.auth.models
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models
import django_mongodb_backend.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('full_name', models.CharField(max_length=255)),
                ('role', models.CharField(
                    choices=[
                        ('PARTICIPANT', 'Participant'),
                        ('PI', 'Principal Investigator'),
                        ('COORDINATOR', 'Coordinator'),
                        ('SPONSOR', 'Sponsor Admin'),
                        ('ADMIN', 'Admin'),
                        ('SUPER_ADMIN', 'Super Admin'),
                    ],
                    default='PARTICIPANT',
                    max_length=20,
                )),
                ('phone_number', models.CharField(blank=True, max_length=20, null=True)),
                ('timezone', models.CharField(default='UTC', max_length=50)),
                ('country', models.CharField(blank=True, max_length=100, null=True)),
                ('has_consented_to_data_use', models.BooleanField(default=False)),
                ('withdrawal_requested', models.BooleanField(default=False)),
                ('data_deletion_requested', models.BooleanField(default=False)),
                ('withdrawal_date', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now)),
                ('groups', models.ManyToManyField(
                    blank=True,
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.group',
                    verbose_name='groups',
                )),
                ('user_permissions', models.ManyToManyField(
                    blank=True,
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.permission',
                    verbose_name='user permissions',
                )),
            ],
            options={
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='OTP',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('code', models.CharField(max_length=6)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_verified', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='MagicLink',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('token', models.CharField(max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_used', models.BooleanField(default=False)),
            ],
        ),
    ]
