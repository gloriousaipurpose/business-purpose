"""Initial migration create tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. runs
    op.create_table(
        'runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('run_type', sa.String(), nullable=False),
        sa.Column('sections', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('sources_checked', sa.JSON(), nullable=False),
        sa.Column('summary_text', sa.Text(), nullable=True),
        sa.Column('key_trends', sa.JSON(), nullable=True),
        sa.Column('changes_from_previous', sa.JSON(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estimated_cost', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('previous_run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_runs_id'), 'runs', ['id'], unique=False)

    # 2. raw_items
    op.create_table(
        'raw_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_raw_items_id'), 'raw_items', ['id'], unique=False)

    # 3. entities
    op.create_table(
        'entities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('canonical_name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('first_seen_run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('last_seen_run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('appearance_count', sa.Integer(), nullable=False, server_default='1'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entities_canonical_name'), 'entities', ['canonical_name'], unique=True)
    op.create_index(op.f('ix_entities_id'), 'entities', ['id'], unique=False)

    # 4. findings
    op.create_table(
        'findings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('entity_id', sa.Integer(), sa.ForeignKey('entities.id'), nullable=True),
        sa.Column('section', sa.String(), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('evidence', sa.JSON(), nullable=False),
        sa.Column('confidence', sa.String(), nullable=False),
        sa.Column('source_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_findings_id'), 'findings', ['id'], unique=False)

    # 5. opportunity_scores
    op.create_table(
        'opportunity_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('entity_id', sa.Integer(), sa.ForeignKey('entities.id'), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('demand_growth', sa.Float(), nullable=False),
        sa.Column('proven_abroad', sa.Float(), nullable=False),
        sa.Column('india_gap', sa.Float(), nullable=False),
        sa.Column('ease_to_build', sa.Float(), nullable=False),
        sa.Column('revenue_potential', sa.Float(), nullable=False),
        sa.Column('timing', sa.Float(), nullable=False),
        sa.Column('confidence', sa.String(), nullable=False),
        sa.Column('subscore_justifications', sa.JSON(), nullable=True),
        sa.Column('risks', sa.JSON(), nullable=True),
        sa.Column('india_competitors_found', sa.JSON(), nullable=True),
        sa.Column('search_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_opportunity_scores_id'), 'opportunity_scores', ['id'], unique=False)

    # 6. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), sa.ForeignKey('runs.id'), nullable=False),
        sa.Column('entity_id', sa.Integer(), sa.ForeignKey('entities.id'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('channel', sa.String(), nullable=False),
        sa.Column('delivered', sa.Boolean(), nullable=False, server_default='1'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)

def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('opportunity_scores')
    op.drop_table('findings')
    op.drop_table('entities')
    op.drop_table('raw_items')
    op.drop_table('runs')
