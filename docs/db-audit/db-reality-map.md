# DB Reality Map


## access_allowlist
| Column | Type |
| --- | --- |
| id | uuid |
| email | text |
| status | text |
| role | text |
| trial_expires_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| created_by | uuid |
| notes | text |

## access_requests
| Column | Type |
| --- | --- |
| id | uuid |
| email | text |
| name | text |
| cohort | text |
| message | text |
| expected_term | text |
| college | text |
| request_status | text |
| source | text |
| ip_hash | text |
| decision_reason | text |
| reviewed_by | uuid |
| reviewed_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## activity_participation
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| activity_id | text |
| participation_type | text |
| start_date | date |
| end_date | date |
| notes | text |
| created_at | timestamp with time zone |

## ai_feedback
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_name | text |
| ai_response | text |
| student_comments | text |
| rating | integer |
| created_at | timestamp with time zone |

## ai_history
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| session_id | uuid |
| query | text |
| response | text |
| context_type | text |
| timestamp | timestamp with time zone |

## ai_tasks
| Column | Type |
| --- | --- |
| id | uuid |
| task_type | character varying |
| input_text | text |
| output_text | text |
| model_used | character varying |
| status | character varying |
| processing_time_ms | integer |
| created_by | uuid |
| created_at | timestamp with time zone |
| completed_at | timestamp with time zone |

## ai_voice_history
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| context_type | text |
| role | text |
| message | text |
| audio_url | text |
| session_id | uuid |
| metadata | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## assignment_briefs
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| original_filename | text |
| file_url | text |
| parsed_text | text |
| parsed_data | jsonb |
| created_at | timestamp with time zone |

## assignment_checklist_items
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| label | text |
| is_done | boolean |
| sort_order | integer |
| created_at | timestamp with time zone |

## assignment_drafts
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| version | integer |
| content | text |
| word_count | integer |
| ai_usage_log | jsonb |
| created_at | timestamp with time zone |

## assignment_durmah_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| stage | integer |
| transcript | ARRAY |
| created_at | timestamp with time zone |

## assignment_feedback
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| released_at | timestamp with time zone |
| overall_comments | text |
| strengths | text |
| improvements | text |
| feed_forward | text |
| grade | text |
| created_at | timestamp with time zone |

## assignment_files
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| bucket | text |
| path | text |
| original_name | text |
| mime_type | text |
| size_bytes | bigint |
| created_at | timestamp with time zone |

## assignment_milestones
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| title | text |
| due_at | timestamp with time zone |
| status | text |
| sort_order | integer |
| created_at | timestamp with time zone |

## assignment_progress
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | text |
| workflow_key | text |
| step_key | text |
| content | jsonb |
| updated_at | timestamp with time zone |
| created_at | timestamp with time zone |

## assignment_research_notes
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| source_type | text |
| citation | text |
| notes | text |
| created_at | timestamp with time zone |

## assignment_rubric_criteria
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| criterion | text |
| description | text |
| weight | numeric |
| sort_order | integer |
| created_at | timestamp with time zone |

## assignment_session_messages
| Column | Type |
| --- | --- |
| id | uuid |
| session_id | uuid |
| user_id | uuid |
| role | text |
| content | text |
| audio_url | text |
| created_at | timestamp with time zone |
| sentiment | text |
| tokens_used | integer |

## assignment_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| duration_seconds | integer |
| title | text |
| summary | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## assignment_stages
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | text |
| user_id | uuid |
| current_stage | integer |
| stage_1_complete | boolean |
| stage_2_complete | boolean |
| stage_3_complete | boolean |
| stage_4_complete | boolean |
| stage_5_complete | boolean |
| stage_6_complete | boolean |
| stage_data | jsonb |
| updated_at | timestamp with time zone |
| created_at | timestamp with time zone |

## assignment_submissions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| submitted_at | timestamp with time zone |
| method | text |
| notes | text |
| file_url | text |
| created_at | timestamp with time zone |

## assignment_widget_links
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_brief_id | uuid |
| assignment_id | uuid |
| last_stage | text |
| updated_at | timestamp with time zone |

## assignment_work_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| minutes | integer |
| focus | text |
| created_at | timestamp with time zone |

## assignments
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| module | text |
| description | text |
| due_date | timestamp with time zone |
| status | text |
| grade | text |
| feedback | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| due_at | timestamp with time zone |
| has_brief | boolean |
| word_limit | integer |
| submission_requirements | text |
| current_stage | integer |
| assignment_type | text |
| module_code | text |
| module_name | text |
| question_text | text |
| estimated_effort_hours | numeric |
| brief_rich | jsonb |
| word_count_target | integer |
| weightage | text |
| source | text |
| module_id | uuid |

## attendance_logs
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| session_id | uuid |
| attended | boolean |
| feedback | text |
| mental_state | text |
| created_at | timestamp with time zone |

## audit_log
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| action | text |
| target_table | text |
| target_id | uuid |
| details | jsonb |
| recorded_at | timestamp with time zone |

## awy_audit_log
| Column | Type |
| --- | --- |
| id | uuid |
| connection_id | uuid |
| action | text |
| actor_user_id | uuid |
| actor_role | text |
| details | jsonb |
| created_at | timestamp with time zone |

## awy_call_links
| Column | Type |
| --- | --- |
| id | uuid |
| owner_id | uuid |
| loved_one_id | uuid |
| url | text |
| updated_at | timestamp with time zone |

## awy_call_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| connection_id | uuid |
| initiator_user_id | uuid |
| recipient_user_id | uuid |
| session_type | text |
| status | text |
| webrtc_session_id | text |
| started_at | timestamp with time zone |
| answered_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| duration_seconds | integer |
| end_reason | text |
| quality_rating | integer |
| metadata | jsonb |
| created_at | timestamp with time zone |

## awy_calls
| Column | Type |
| --- | --- |
| id | uuid |
| connection_id | uuid |
| student_id | uuid |
| loved_one_id | uuid |
| status | text |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| duration_seconds | integer |
| created_at | timestamp with time zone |
| room_url | text |
| room_name | text |
| accepted_at | timestamp with time zone |
| caller_id | uuid |

## awy_connections
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| loved_email | USER-DEFINED |
| relationship | text |
| display_name | text |
| loved_one_id | uuid |
| status | text |
| is_visible | boolean |
| invitation_token | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| student_id | uuid |
| owner_user_id | uuid |
| loved_user_id | uuid |
| relationship_label | text |
| invite_token | text |
| accepted_at | timestamp with time zone |
| student_user_id | uuid |
| email | text |
| nickname | text |
| invited_at | timestamp with time zone |
| granted_at | timestamp with time zone |
| revoked_at | timestamp with time zone |
| granted_by | uuid |
| revoked_by | uuid |
| last_seen_at | timestamp with time zone |
| note | text |
| phone_e164 | text |
| whatsapp_e164 | text |
| facetime_contact | text |
| google_meet_url | text |
| preferred_channel | text |

## awy_connections_admin_view
| Column | Type |
| --- | --- |
| connection_id | uuid |
| status | text |
| invited_at | timestamp with time zone |
| accepted_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| student_id | uuid |
| student_name | text |
| student_email | character varying |
| loved_email | USER-DEFINED |
| loved_one_id | uuid |
| loved_name | text |
| relationship | text |
| relationship_label | text |
| nickname | text |

## awy_events
| Column | Type |
| --- | --- |
| id | uuid |
| sender_id | uuid |
| receiver_id | uuid |
| kind | text |
| payload | jsonb |
| created_at | timestamp with time zone |
| read_at | timestamp with time zone |

## awy_interactions
| Column | Type |
| --- | --- |
| id | uuid |
| from_user_id | uuid |
| to_user_id | uuid |
| connection_id | uuid |
| interaction_type | text |
| message | text |
| metadata | jsonb |
| read_at | timestamp with time zone |
| created_at | timestamp with time zone |

## awy_notifications
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| connection_id | uuid |
| notification_type | text |
| title | text |
| message | text |
| action_url | text |
| is_read | boolean |
| metadata | jsonb |
| expires_at | timestamp with time zone |
| created_at | timestamp with time zone |
| recipient_user_id | uuid |
| from_user_id | uuid |
| type | text |
| read_at | timestamp with time zone |

## awy_presence
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| status | text |
| last_seen | timestamp with time zone |
| is_available_for_calls | boolean |
| custom_message | text |
| updated_at | timestamp with time zone |
| is_available | boolean |
| last_seen_at | timestamp with time zone |
| status_message | text |
| heartbeat_at | timestamp with time zone |
| availability_status | text |
| availability_mode | text |
| availability_expires_at | timestamp with time zone |
| availability_note | text |
| availability_note_expires_at | timestamp with time zone |

## awy_waves
| Column | Type |
| --- | --- |
| id | uuid |
| sender_id | uuid |
| receiver_id | uuid |
| message | text |
| is_read | boolean |
| created_at | timestamp with time zone |

## billing_events
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| event_type | text |
| event_data | jsonb |
| stripe_event_id | text |
| processed_at | timestamp with time zone |

## bookmarks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| place_id | text |
| category | text |
| created_at | timestamp without time zone |

## call_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| caller_id | uuid |
| callee_id | uuid |
| status | text |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| duration_seconds | integer |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## cards
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| topic | text |
| prompt | text |
| answer | text |
| ef | real |
| interval | integer |
| due_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## chat_history
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| message | text |
| response | text |
| context | jsonb |
| created_at | timestamp without time zone |

## chat_logs
| Column | Type |
| --- | --- |
| id | bigint |
| user_input | text |
| bot_reply | text |
| created_at | timestamp with time zone |
| user_id | uuid |

## community_cache
| Column | Type |
| --- | --- |
| id | uuid |
| fetched_at | timestamp with time zone |
| items | jsonb |

## community_members
| Column | Type |
| --- | --- |
| user_id | uuid |
| display_name | text |
| year_of_study | text |
| allow_dm | boolean |
| show_presence | boolean |
| presence_status | text |
| last_seen | timestamp with time zone |

## community_settings
| Column | Type |
| --- | --- |
| user_id | uuid |
| allow_dm | boolean |
| show_presence | boolean |
| updated_at | timestamp with time zone |
| status | text |
| created_at | timestamp with time zone |

## contact_messages
| Column | Type |
| --- | --- |
| id | uuid |
| name | character varying |
| email | character varying |
| subject | character varying |
| message | text |
| status | character varying |
| handled_by | character varying |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## delsa_progress
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| milestone_id | integer |
| completed | boolean |
| completed_date | timestamp with time zone |
| evidence | text |
| reflection_notes | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## documents
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| filename | text |
| content | text |
| summary | text |
| extracted_concepts | jsonb |
| uploaded_at | timestamp without time zone |

## durham_academic_content
| Column | Type |
| --- | --- |
| id | uuid |
| module_code | text |
| year | integer |
| title | text |
| content_type | text |
| content | text |
| metadata | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## durmah_interest_events
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| event_type | text |
| source | text |
| title | text |
| url | text |
| snippet | text |
| tags | ARRAY |
| metadata | jsonb |
| created_at | timestamp with time zone |

## durmah_memory
| Column | Type |
| --- | --- |
| user_id | uuid |
| last_seen_at | timestamp with time zone |
| last_topic | text |
| last_message | text |

## durmah_messages
| Column | Type |
| --- | --- |
| id | uuid |
| session_id | uuid |
| user_id | uuid |
| role | text |
| content | text |
| created_at | timestamp with time zone |
| meta | jsonb |
| saved_at | timestamp with time zone |
| context | jsonb |
| modality | text |
| source | text |
| scope | text |
| visibility | text |
| conversation_id | uuid |
| scope_id | uuid |

## durmah_nudges
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| assignment_id | uuid |
| nudge_type | text |
| last_sent_at | timestamp with time zone |
| dismissed_until | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## durmah_sessions
| Column | Type |
| --- | --- |
| id | text |
| user_id | uuid |
| source | text |
| scope | text |
| scope_id | text |
| title | text |
| created_at | timestamp with time zone |
| closed_at | timestamp with time zone |
| saved | boolean |
| message_count | integer |
| last_message_at | timestamp with time zone |
| metadata | jsonb |

## durmah_summaries
| Column | Type |
| --- | --- |
| id | uuid |
| session_id | uuid |
| user_id | uuid |
| summary | text |
| created_at | timestamp with time zone |
| token_estimate | integer |

## durmah_threads
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| onboarding_state | text |
| last_seen_at | timestamp with time zone |
| last_message_at | timestamp with time zone |
| last_summary | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| metadata | jsonb |

## durmah_user_memory
| Column | Type |
| --- | --- |
| user_id | uuid |
| last_seen_at | timestamp with time zone |
| last_topic | text |
| last_message | text |
| updated_at | timestamp with time zone |

## exam_artifacts
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_id | uuid |
| workspace_id | uuid |
| type | text |
| title | text |
| content_md | text |
| source_refs | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## exam_messages
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| workspace_id | uuid |
| module_id | uuid |
| session_id | uuid |
| role | text |
| message_md | text |
| artifact_id | uuid |
| source_refs | jsonb |
| created_at | timestamp with time zone |

## exam_preparation
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| module_name | text |
| exam_date | timestamp with time zone |
| readiness_score | integer |
| syllabus_covered | boolean |
| past_papers_practised | integer |
| notes | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## exam_results
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module | text |
| score | integer |
| total_questions | integer |
| time_spent | integer |
| weak_topics | jsonb |

## exam_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| workspace_id | uuid |
| module_id | uuid |
| session_title | text |
| status | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## exam_workspace_state
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| workspace_id | uuid |
| module_id | uuid |
| last_tab | text |
| last_artifact_id | uuid |
| last_scroll_anchor | text |
| last_opened_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## exam_workspaces
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_id | uuid |
| status | text |
| created_reason | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## flashcard_decks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| name | text |
| description | text |
| module | text |
| created_at | timestamp with time zone |

## flashcards
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| deck_id | uuid |
| front | text |
| back | text |
| module | text |
| difficulty | integer |
| next_review | timestamp without time zone |
| ease_factor | double precision |
| interval | integer |

## group_memberships
| Column | Type |
| --- | --- |
| id | uuid |
| group_id | uuid |
| user_id | uuid |
| joined_at | timestamp with time zone |

## import_jobs
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| kind | text |
| status | text |
| started_at | timestamp with time zone |
| finished_at | timestamp with time zone |
| error_text | text |
| metadata | jsonb |
| created_at | timestamp with time zone |

## import_sources
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| import_job_id | uuid |
| kind | text |
| filename | text |
| file_size_bytes | integer |
| raw_text | text |
| deleted_at | timestamp with time zone |
| created_at | timestamp with time zone |

## journal_entries
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| content | text |
| created_at | timestamp with time zone |

## lead_tags
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| tag_name | character varying |
| tag_type | character varying |
| assigned_by | uuid |
| notes | text |
| created_at | timestamp with time zone |

## lecture_chat_messages
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| lecture_id | uuid |
| role | text |
| content | text |
| created_at | timestamp with time zone |
| thread_id | uuid |
| model | text |
| usage_tokens | integer |
| saved_at | timestamp with time zone |
| session_id | uuid |
| message_kind | text |

## lecture_notes
| Column | Type |
| --- | --- |
| lecture_id | uuid |
| summary | text |
| key_points | jsonb |
| discussion_topics | jsonb |
| exam_prompts | jsonb |
| glossary | jsonb |
| created_at | timestamp with time zone |
| engagement_hooks | jsonb |
| exam_signals | jsonb |

## lecture_transcripts
| Column | Type |
| --- | --- |
| lecture_id | uuid |
| transcript_text | text |
| word_count | integer |
| created_at | timestamp with time zone |

## lecturer_feedback
| Column | Type |
| --- | --- |
| id | uuid |
| lecturer_id | uuid |
| user_id | uuid |
| pace | text |
| clarity | text |
| examples | text |
| best_tip | text |
| created_at | timestamp with time zone |

## lecturer_insights
| Column | Type |
| --- | --- |
| id | uuid |
| lecturer_id | uuid |
| lecture_count | integer |
| insights_json | jsonb |
| updated_at | timestamp with time zone |

## lecturers
| Column | Type |
| --- | --- |
| id | uuid |
| name | text |
| name_normalized | text |
| created_at | timestamp with time zone |

## lectures
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| module_name | text |
| lecturer_name | text |
| title | text |
| lecture_date | date |
| audio_path | text |
| audio_mime | text |
| audio_duration_seconds | integer |
| status | text |
| error_message | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| last_processed_at | timestamp with time zone |
| panopto_url | text |
| transcript_source | text |
| module_id | uuid |
| user_module_id | uuid |

## legal_news_cache
| Column | Type |
| --- | --- |
| id | uuid |
| fetched_at | timestamp with time zone |
| items | jsonb |

## lounge_blocks
| Column | Type |
| --- | --- |
| blocker_id | uuid |
| blocked_id | uuid |
| created_at | timestamp with time zone |

## lounge_coffee_rsvp
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| event_date | date |
| created_at | timestamp with time zone |

## lounge_joiners
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| full_name | text |
| avatar_url | text |
| joined_at | timestamp with time zone |

## lounge_messages
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | text |
| username | text |
| text | text |
| created_at | timestamp with time zone |

## lounge_posts
| Column | Type |
| --- | --- |
| id | uuid |
| author_id | uuid |
| body | text |
| image_url | text |
| audio_url | text |
| created_at | timestamp with time zone |
| is_hidden | boolean |
| is_shadow_muted | boolean |
| automod_flag | boolean |

## lounge_reactions
| Column | Type |
| --- | --- |
| post_id | uuid |
| user_id | uuid |
| emoji | text |
| created_at | timestamp with time zone |

## lounge_shoutouts
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| name | text |
| message | text |
| created_at | timestamp with time zone |

## lounge_sparks
| Column | Type |
| --- | --- |
| id | uuid |
| author_id | uuid |
| text | text |
| created_at | timestamp with time zone |
| is_hidden | boolean |
| is_shadow_muted | boolean |
| automod_flag | boolean |

## lounge_user_settings
| Column | Type |
| --- | --- |
| user_id | uuid |
| accepted_rules_at | timestamp with time zone |

## member_presence
| Column | Type |
| --- | --- |
| user_id | uuid |
| status | USER-DEFINED |
| last_seen | timestamp with time zone |
| updated_at | timestamp with time zone |

## memory_logs
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| note | text |
| created_at | timestamp with time zone |
| mood | text |

## memory_notes
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| content | text |
| tags | ARRAY |
| category | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## module_catalog
| Column | Type |
| --- | --- |
| id | uuid |
| code | text |
| title | text |
| year_level | integer |
| term | text |
| is_core | boolean |
| credits | integer |
| created_at | timestamp with time zone |

## module_lecture_sets
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_id | uuid |
| expected_count | integer |
| uploaded_count | integer |
| is_complete | boolean |
| completed_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## module_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| module_code | text |
| session_date | date |
| topic | text |
| created_at | timestamp with time zone |

## modules
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| code | text |
| term | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## mood_entries
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| score | integer |
| stressors | ARRAY |
| note | text |
| created_at | timestamp with time zone |

## news_analyses
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| article_title | text |
| article_url | text |
| article_source | text |
| original_text | text |
| ai_analysis | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## news_preferences
| Column | Type |
| --- | --- |
| user_id | uuid |
| preferences | jsonb |

## onboarding_docs
| Column | Type |
| --- | --- |
| id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| doc_type | text |
| title | text |
| slug | text |
| category | text |
| content_markdown | text |
| content_html | text |
| summary | text |
| year_level | ARRAY |
| module_codes | ARRAY |
| keywords | ARRAY |
| related_questions | ARRAY |
| is_published | boolean |
| display_order | integer |
| screenshots | jsonb |
| video_url | text |

## onboarding_status
| Column | Type |
| --- | --- |
| user_id | uuid |
| completed_steps | jsonb |
| completeness_score | integer |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## onboarding_tasks
| Column | Type |
| --- | --- |
| task_key | text |
| label | text |
| description | text |
| href | text |
| sort_order | integer |
| optional | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## oscola_citations
| Column | Type |
| --- | --- |
| id | uuid |
| assignment_id | uuid |
| user_id | uuid |
| citation_text | text |
| short_form | text |
| source_type | text |
| footnote_number | integer |
| created_at | timestamp with time zone |

## parent_links
| Column | Type |
| --- | --- |
| user_id | uuid |
| parent_email | text |
| consented | boolean |

## peer_profiles
| Column | Type |
| --- | --- |
| user_id | uuid |
| tags | ARRAY |
| availability | ARRAY |
| goals | ARRAY |
| score | integer |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## personal_items
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| type | text |
| title | text |
| description | text |
| module_id | text |
| start_at | timestamp with time zone |
| end_at | timestamp with time zone |
| completed | boolean |
| priority | text |
| notes | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| is_all_day | boolean |
| original_plan_id | character varying |
| original_timetable_id | uuid |
| tutor | text |
| venue | text |
| color | character varying |
| is_cancelled | boolean |
| assignment_id | uuid |

## probono_participation
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| project_id | text |
| hours_completed | integer |
| supervisor_contact | text |
| skills_gained | ARRAY |
| reflection | text |
| status | text |
| start_date | date |
| end_date | date |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## profiles
| Column | Type |
| --- | --- |
| id | uuid |
| year_group | text |
| agreed_to_terms | boolean |
| display_name | text |
| avatar_url | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| created_via | character varying |
| durmah_voice | text |
| voice_speed | text |
| voice_mode_enabled | boolean |
| ai_safety_level | text |
| feedback_reminder_opt_in | boolean |
| onboarding_status | text |
| uploaded_docs | jsonb |
| syllabus_summary | text |
| academic_goal | text |
| year_of_study | text |
| user_role | text |
| is_online | boolean |
| last_seen | timestamp with time zone |
| stripe_customer_id | text |
| subscription_status | text |
| trial_ends_at | timestamp with time zone |
| current_period_end | timestamp with time zone |
| user_type | text |
| durmah_voice_id | text |
| preferred_name | text |
| degree_type | text |
| modules | ARRAY |
| last_profile_updated_at | timestamp with time zone |
| trial_started_at | timestamp with time zone |
| trial_ever_used | boolean |
| is_test_account | boolean |
| subscription_ends_at | timestamp with time zone |
| notes | text |
| onboarding_progress | integer |
| role | text |
| accepted_terms_at | timestamp with time zone |
| accepted_privacy_at | timestamp with time zone |
| terms_version | text |
| privacy_version | text |
| timetable_url | text |
| blackboard_url | text |
| trial_until | timestamp with time zone |
| feature_familiarity | jsonb |

## progress_checks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_id | text |
| syllabus_topic_id | text |
| status | text |
| notes | text |
| time_spent_minutes | integer |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## quiz_message_sources
| Column | Type |
| --- | --- |
| id | uuid |
| message_id | uuid |
| source_type | text |
| source_id | uuid |
| content_snippet | text |
| relevance_score | double precision |
| created_at | timestamp with time zone |

## quiz_messages
| Column | Type |
| --- | --- |
| id | uuid |
| session_id | uuid |
| user_id | uuid |
| role | text |
| content | text |
| created_at | timestamp with time zone |
| metadata | jsonb |

## quiz_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| quiz_type | text |
| target_id | uuid |
| status | text |
| performance_metadata | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| module_id | uuid |

## referrals
| Column | Type |
| --- | --- |
| id | uuid |
| referrer_user_id | uuid |
| referred_email | text |
| referred_email_normalized | text |
| referred_name | text |
| status | text |
| invite_token | text |
| invited_at | timestamp with time zone |
| joined_user_id | uuid |
| joined_at | timestamp with time zone |
| subscribed_at | timestamp with time zone |
| reward_granted_at | timestamp with time zone |

## revision_items
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| lecture_id | uuid |
| topic_title | text |
| notes | text |
| created_at | timestamp with time zone |

## seo_pages
| Column | Type |
| --- | --- |
| id | uuid |
| title | character varying |
| slug | character varying |
| content | text |
| meta_description | text |
| keywords | ARRAY |
| status | character varying |
| published_at | timestamp with time zone |
| views | integer |
| author_id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## session_logs
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| topic | text |
| duration_min | integer |
| started_at | timestamp with time zone |
| difficulty | integer |
| notes | text |
| created_at | timestamp with time zone |

## student_invitations
| Column | Type |
| --- | --- |
| id | uuid |
| email | text |
| display_name | text |
| year_group | text |
| invited_by | text |
| invite_token | text |
| status | text |
| trial_days | integer |
| created_at | timestamp with time zone |
| expires_at | timestamp with time zone |
| accepted_at | timestamp with time zone |
| user_id | uuid |

## student_modules
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| academic_year | integer |
| is_compulsory | boolean |
| created_at | timestamp with time zone |

## student_profiles
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| academic_year | integer |
| career_path | text |
| college | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## study_groups
| Column | Type |
| --- | --- |
| id | uuid |
| owner_id | uuid |
| name | text |
| description | text |
| created_at | timestamp with time zone |

## study_sessions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module | text |
| topic | text |
| duration | integer |
| efficiency | integer |
| notes | text |
| created_at | timestamp without time zone |
| start_time | timestamp with time zone |
| end_time | timestamp with time zone |

## study_tasks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| task | text |
| task_date | date |
| completed | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## subscription_plans
| Column | Type |
| --- | --- |
| id | uuid |
| name | text |
| description | text |
| price_monthly | numeric |
| price_yearly | numeric |
| features | jsonb |
| max_awy_connections | integer |
| ai_chat_limit | integer |
| priority_support | boolean |
| is_active | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## support_admin_notes
| Column | Type |
| --- | --- |
| id | uuid |
| created_at | timestamp with time zone |
| ticket_id | uuid |
| admin_user_id | uuid |
| note | text |

## support_kb_articles
| Column | Type |
| --- | --- |
| id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| title | text |
| slug | text |
| body | text |
| tags | ARRAY |
| is_published | boolean |

## support_messages
| Column | Type |
| --- | --- |
| id | uuid |
| created_at | timestamp with time zone |
| ticket_id | uuid |
| role | text |
| content | text |
| meta | jsonb |

## support_tickets
| Column | Type |
| --- | --- |
| id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| status | text |
| priority | text |
| source | text |
| is_visitor | boolean |
| visitor_email | text |
| visitor_name | text |
| user_id | uuid |
| display_name | text |
| subject | text |
| last_message_at | timestamp with time zone |
| tags | ARRAY |
| page_url | text |
| user_agent | text |
| client_meta | jsonb |

## support_user_issue_summaries
| Column | Type |
| --- | --- |
| user_id | uuid |
| updated_at | timestamp with time zone |
| summary | text |

## timetable_events
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| module_code | text |
| location | text |
| start_time | timestamp with time zone |
| end_time | timestamp with time zone |
| recurrence_pattern | text |
| source | text |
| created_at | timestamp with time zone |

## timetable_items
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| starts_at | timestamp with time zone |
| ends_at | timestamp with time zone |
| title | text |
| module | text |
| location | text |
| source | text |
| created_at | timestamp with time zone |

## transcript_folder_items
| Column | Type |
| --- | --- |
| folder_id | uuid |
| journal_id | uuid |
| created_at | timestamp with time zone |
| user_id | uuid |

## transcript_folders
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| name | text |
| color | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| parent_id | uuid |

## triage_results
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| risk_level | character varying |
| responses | jsonb |
| urgency_score | integer |
| symptoms | ARRAY |
| recommendations | ARRAY |
| created_at | timestamp with time zone |

## usage_tracking
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| feature_type | text |
| usage_count | integer |
| period_start | timestamp with time zone |
| period_end | timestamp with time zone |
| metadata | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_access_grants
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| grant_type | text |
| source | text |
| referral_id | uuid |
| starts_at | timestamp with time zone |
| expires_at | timestamp with time zone |
| revoked_at | timestamp with time zone |
| notes | text |
| created_at | timestamp with time zone |

## user_assessments
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| import_source_id | uuid |
| module_code | text |
| title | text |
| description | text |
| due_at | timestamp with time zone |
| weightage | numeric |
| assessment_type | text |
| source | text |
| source_meta | jsonb |
| verified | boolean |
| deleted_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_assignment_briefs
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| title | text |
| due_at | timestamp with time zone |
| word_count | integer |
| weighting | integer |
| submission_type | text |
| late_allowed | boolean |
| resubmissions_allowed | boolean |
| rubric_json | jsonb |
| source | text |
| import_source_id | uuid |
| extracted_text | text |
| needs_review | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| deleted_at | timestamp with time zone |

## user_calendar_events
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| description | text |
| event_date | date |
| event_time | time without time zone |
| event_type | text |
| module_code | text |
| location | text |
| reminder_set | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_entitlements
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| product | text |
| tier | text |
| status | text |
| expires_at | timestamp with time zone |
| features | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_events
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| import_source_id | uuid |
| external_id | text |
| title | text |
| description | text |
| location | text |
| event_type | text |
| start_at | timestamp with time zone |
| end_at | timestamp with time zone |
| all_day | boolean |
| module_code | text |
| source | text |
| source_meta | jsonb |
| verified | boolean |
| deleted_at | timestamp with time zone |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_exam_dates
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| module_code | text |
| title | text |
| exam_at | timestamp with time zone |
| duration_minutes | integer |
| location | text |
| source | text |
| import_source_id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| deleted_at | timestamp with time zone |

## user_modules
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| catalog_id | uuid |
| status | text |
| created_at | timestamp with time zone |
| staff_names | jsonb |
| staff_display | text |
| is_active | boolean |

## user_notes
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| content | text |
| linked_place_id | text |

## user_onboarding
| Column | Type |
| --- | --- |
| user_id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| timetable_done | boolean |
| assignment_done | boolean |
| lecture_done | boolean |
| awy_done | boolean |
| last_checked_at | timestamp with time zone |

## user_onboarding_tasks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| task_key | text |
| completed | boolean |
| completed_at | timestamp with time zone |
| metadata | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_preferences
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| preferred_view | text |
| notifications_enabled | boolean |
| reminder_hours_before | integer |
| study_time_goal_hours | integer |
| theme | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_profiles
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| email | text |
| year | integer |
| modules | ARRAY |
| interests | ARRAY |
| timezone | text |
| consent_wellbeing | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_subscriptions
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| plan_id | uuid |
| status | text |
| trial_start_date | timestamp with time zone |
| trial_end_date | timestamp with time zone |
| current_period_start | timestamp with time zone |
| current_period_end | timestamp with time zone |
| cancel_at_period_end | boolean |
| cancelled_at | timestamp with time zone |
| stripe_subscription_id | text |
| stripe_customer_id | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

## user_tasks
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| due_date | date |
| status | text |
| created_at | timestamp with time zone |

## user_voice_settings
| Column | Type |
| --- | --- |
| user_id | uuid |
| voice_id | text |
| delivery_style | text |
| speed | numeric |
| updated_at | timestamp with time zone |

## voice_context_stats
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| context_type | text |
| message_count | integer |
| last_activity | timestamp with time zone |

## voice_conversations
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| content | text |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| context_route | text |
| context_term | text |
| context_year_label | text |
| context_module_id | text |
| context_module_code | text |
| context_week | text |
| context_tags | ARRAY |
| metadata | jsonb |
| created_at | timestamp with time zone |

## voice_journal_stats
| Column | Type |
| --- | --- |
| user_id | uuid |
| sessions | bigint |
| total_duration_seconds | bigint |
| last_session_at | timestamp with time zone |

## voice_journals
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| session_id | text |
| started_at | timestamp with time zone |
| ended_at | timestamp with time zone |
| duration_seconds | integer |
| topic | text |
| summary | text |
| transcript | jsonb |
| is_pinned | boolean |
| pinned_at | timestamp with time zone |
| archived | boolean |
| search_tsv | tsvector |
| content_text | text |
| source_type | text |
| source_id | text |

## voice_settings
| Column | Type |
| --- | --- |
| user_id | uuid |
| preferred_voice_id | text |
| auto_relisten | boolean |
| mic_autorestart | boolean |

## wellbeing_checkins
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| mood_rating | integer |
| stress_level | integer |
| sleep_hours | numeric |
| notes | text |
| support_needed | boolean |
| checkin_date | date |
| created_at | timestamp with time zone |

## wellbeing_entries
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| mood_rating | integer |
| stress_level | integer |
| notes | text |
| entry_date | date |
| created_at | timestamp with time zone |

## writing_samples
| Column | Type |
| --- | --- |
| id | uuid |
| user_id | uuid |
| title | text |
| content | text |
| word_count | integer |
| style_analysis | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| embedding | USER-DEFINED |
