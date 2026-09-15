import { supabase } from '@/lib/supabaseClient';

export type OnboardingRole = 'CUSTOMER' | 'RIDER' | 'MERCHANT' | 'AFFILIATE' | 'STAFF';

export interface OnboardingState {
    role: OnboardingRole;
    currentStep: string;
    completedSteps: string[];
    score: number;
    isCompleted: boolean;
}

/**
 * Apex OS: Onboarding Orchestration Engine
 * Managed the specialized flows for every entity in the ecosystem.
 */
export const onboardingEngine = {
    /**
     * Retrieves or initializes the onboarding progress for a user.
     */
    async getProgress(userId: string, role: OnboardingRole): Promise<OnboardingState | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('onboarding_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('role', role)
            .maybeSingle();

        if (error) {
            console.error("Onboarding Engine Sync Error:", error);
            return null;
        }

        if (!data) {
            // Initialize new progress
            const initialState = {
                user_id: userId,
                role: role,
                current_step: 'welcome',
                completed_steps: [],
                score: 0
            };
            const { data: newData } = await supabase.from('onboarding_progress').insert([initialState]).select().single();
            return mapToState(newData);
        }

        return mapToState(data);
    },

    /**
     * Marks a step as complete and advances to the next one.
     */
    async completeStep(userId: string, role: OnboardingRole, stepId: string, nextStep: string, metadata: Record<string, unknown> = {}) {
        if (!supabase) return;

        const { data: current } = await supabase
            .from('onboarding_progress')
            .select('completed_steps, metadata')
            .eq('user_id', userId)
            .eq('role', role)
            .single();

        const completed = new Set(current?.completed_steps || []);
        completed.add(stepId);

        const mergedMetadata = { ...(current?.metadata || {}), ...metadata };

        // Logic: Role-specific weights
        const weights: Record<OnboardingRole, number> = {
            'CUSTOMER': 3,
            'RIDER': 7,
            'MERCHANT': 6,
            'AFFILIATE': 4,
            'STAFF': 5
        };

        const score = Math.min(100, Math.round((completed.size / weights[role]) * 100));
        const isCompleted = score >= 100;

        await supabase.from('onboarding_progress')
            .update({
                current_step: nextStep,
                completed_steps: Array.from(completed),
                score: score,
                is_completed: isCompleted,
                metadata: mergedMetadata,
                completed_at: isCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('role', role);

        // Log Event
        await supabase.from('onboarding_events').insert([{
            user_id: userId,
            role: role,
            step_id: stepId,
            event_type: 'COMPLETE',
            metadata: metadata
        }]);
    },

    /**
     * Records the "Activation Action" (First real business value).
     */
    async recordActivation(userId: string, role: OnboardingRole, actionType: string) {
        if (!supabase) return;
        await supabase.from('activation_triggers').insert([{
            user_id: userId,
            role: role,
            trigger_type: actionType
        }]);
    }
};

interface OnboardingRow {
    role: OnboardingRole;
    current_step: string;
    completed_steps?: string[];
    score?: number;
    is_completed?: boolean;
}

/**
 * Helper to map DB row to OnboardingState interface
 */
function mapToState(data: OnboardingRow): OnboardingState {
    return {
        role: data.role,
        currentStep: data.current_step,
        completedSteps: data.completed_steps || [],
        score: data.score || 0,
        isCompleted: data.is_completed || false
    };
}


